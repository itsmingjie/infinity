/**
 * Handles all puzzle-related services
 * including listing/submission etc.
 */

const express = require('express')
const app = express.Router()
const rateLimit = require('express-rate-limit')
const bodyParser = require('body-parser')
const LimitStore = require('rate-limit-redis')

const db = require('../services/db')
const airtable = require('../services/airtable')
const messages = require('../lib/messages')
const flagger = require('../lib/flagger')
const divisions = require('../lib/divisions')
const redisClient = require('../services/redis').client
const discord = require('../services/discord')
const config = require('../config')

app.use(bodyParser.json())

// solving is limited to 5 attempts per minute per team
const solveLimiter = rateLimit({
  store: new LimitStore({
    client: redisClient
  }),
  keyGenerator: function (req) {
    return req.user.id
  },
  windowMs: 60 * 1000,
  max: 10 // limit each account to 10 attempts per min
})

// Cached in memory
let PUZZLES_CACHE, LEVELS_CACHE, SOLUTION_CACHE, HINTS_CACHE

// middleware to check for valid cache
const cacheCheck = () => (req, res, next) => {
  if (
    typeof PUZZLES_CACHE === 'undefined' ||
    typeof LEVELS_CACHE === 'undefined' ||
    typeof SOLUTION_CACHE === 'undefined' ||
    typeof HINTS_CACHE === 'undefined'
  ) {
    restock().then(() => next())
  } else {
    // skipped - continue
    next()
  }
}

app.get('/', cacheCheck(), (req, res) => {
  console.log('Oh look! I can pull levels directly from cache!')

  if (
    res.locals.global.anchorPuzzle &&
    !res.locals.solvedList.includes(res.locals.global.anchorPuzzle)
  ) {
    res.redirect('/game/' + Object.keys(LEVELS_CACHE)[0])
  } else {
    res.render('game/levels', { title: 'Levels', levels: LEVELS_CACHE })
  }
})

app.get('/:level', cacheCheck(), (req, res) => {
  console.log('Oh look! I can pull puzzles directly from cache!')
  const level = LEVELS_CACHE[req.params.level]

  if (level) {
    const prereqs = level['Prereq']

    if (
      prereqs &&
      !prereqs.every((v) => {
        // make sure every prereq is satisfied with the currently solved list
        return res.locals.solvedList.includes(v)
      })
    ) {
      res.render('message', messages.unsolvedPrereq)
      return
    }

    res.render('game/level', {
      title: level.Title,
      puzzles: level.puzzleList,
      metas: level.Meta,
      solved: res.locals.solvedList
    })
  } else {
    res.render('message', messages.notFound)
  }
})

app.get('/puzzle/:puzzle', cacheCheck(), async (req, res) => {
  const puzzle = PUZZLES_CACHE[req.params.puzzle]
  const unlockedHints = await db.getUnlockedHints(
    req.user.id,
    req.params.puzzle
  )

  const unlockedHintsData = unlockedHints.map((h) => {
    return {
      id: h,
      text: HINTS_CACHE[req.params.puzzle][h]
    }
  })

  if (puzzle) {
    res.render('game/puzzle', {
      title: `${puzzle.Meta ? 'META — ' : ''}${puzzle.Title} — ${
        puzzle.Value
      } pts`,
      id: req.params.puzzle,
      puzzle,
      unlockedHints: unlockedHintsData,
      css: puzzle['CustomCSS'] || false,
      solved: res.locals.solvedList.includes(req.params.puzzle),
      csrfToken: req.csrfToken()
    })
  } else {
    res.render('message', messages.notFound)
  }
})

app.post('/puzzle/:puzzle', solveLimiter, cacheCheck(), (req, res) => {
  // validation
  const solution = req.body.solution.trim().toLowerCase()
  if (
    solution == null ||
    solution === '' ||
    /[1234567890~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?  \t]/g.test(solution)
  ) {
    res.json({
      success: false,
      message:
        'Invalid Solution! Solutions can only contain letters. Please try again!'
    })
  }

  if (!res.locals.solvedList.includes(req.params.puzzle)) {
    const puzzle = PUZZLES_CACHE[req.params.puzzle]

    if (puzzle) {
      const isMeta = puzzle.meta // whether the puzzle is a metapuzzle

      flagger
        .validateHash(solution, SOLUTION_CACHE[req.params.puzzle])
        .then((success) => {
          // log the attempt in the database, also increments the score if applicable
          db.createAttempt(
            req.user.id,
            req.params.puzzle,
            success ? '[redacted]' : solution,
            puzzle.Value,
            success
          )
            .then(async (attempt) => {
              const attemptId = attempt.id
              const attemptTs = attempt.timestamp

              if (success) {
                // mark time if final
                const finished =
                  req.params.puzzle === divisions[res.locals.team.division][2]
                const finalized = req.params.puzzle === config.last_puzzle

                db.userFinish(req.user.id, finished, finalized)
                discord.push(
                  `✅ **${res.locals.team.display_name}** solved puzzle \`${req.params.puzzle}\``
                )

                if (finished) {
                  discord.push(
                    `⭐ **${
                      res.locals.team.display_name
                    }** just finished the division's final puzzle at ${
                      new Date().toLocaleString('en-En', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        timeZone: 'America/New_York'
                      }) + ' ET'
                    }.`
                  )
                }

                if (finalized) {
                  discord.push(
                    `🌟 **${
                      res.locals.team.display_name
                    }** just finished the final puzzle of the competition at ${
                      new Date().toLocaleString('en-En', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        timeZone: 'America/New_York'
                      }) + ' ET'
                    }.`
                  )
                }

                db.updateScore(req.user.id, puzzle.Value).then(() => {
                  res.json({
                    success: true,
                    message:
                      puzzle.CustomSuccess ||
                      'Congratulations! Your solution was correct. Time to take on the next one?',
                    reference: `${attemptId} @ ${attemptTs}`,
                    isMeta
                  })
                })
              } else {
                discord.push(
                  `❌ **${res.locals.team.display_name}** attempted **\`${solution}\`** for \`${req.params.puzzle}\`.`
                )

                const close1 = puzzle['Close1']
                  ? await flagger.validateHash(solution, puzzle['Close1'])
                  : false
                const close2 = puzzle['Close2']
                  ? await flagger.validateHash(solution, puzzle['Close2'])
                  : false

                if (close1) {
                  return res.json({
                    success: false,
                    message: puzzle['Close1Hint'],
                    reference: `${attemptId} @ ${attemptTs}`
                  })
                } else if (close2) {
                  return res.json({
                    success: false,
                    message: puzzle['Close2Hint'],
                    reference: `${attemptId} @ ${attemptTs}`
                  })
                } else {
                  res.json({
                    success: false,
                    message: puzzle.CustomError || 'Try again next time?',
                    reference: `${attemptId} @ ${attemptTs}`
                  })
                }
              }
            })
            .catch((err) => {
              console.log(err)
              res.json({
                success: false,
                message: 'An unknown error occured.',
                reference: err
              })
            })
        })
    } else {
      res.status(404).json({
        success: false,
        message: messages.notFound.message
      })
    }
  } else {
    res.status(400).json({
      success: false,
      message: messages.caughtRedHanded.message
    })
  }
})

app.get('/puzzle/:puzzle/hint/:hint', cacheCheck(), async (req, res) => {
  const userCredits = await db.getHintCredit(req.user.id)
  const unlockedHints = await db.getUnlockedHints(
    req.user.id,
    req.params.puzzle
  )

  if (unlockedHints.includes(req.params.hint)) {
    res.render('message', messages.hintAlreadyUnlocked)
  } else if (userCredits < 1) {
    res.render('message', messages.outOfHintCredit)
  } else {
    discord.push(
      `🔑 **${res.locals.team.display_name}** unlocked hint \`${req.params.hint}\` for \`${req.params.puzzle}\`.`
    )

    db.createHintIntent(req.user.id, req.params.puzzle, req.params.hint, 0)
      .then(() => {
        res.redirect(req.get('referer') + '#' + req.params.hint)
      })
      .catch((err) => {
        console.log(err)
      })
  }
})

// repull information from Airtable to memory
// note: always restock both caches together to prevent data mismatch
const restock = async () => {
  const puzzles = await airtable.getUnlockedPuzzles(true)
  const levels = await airtable.getLevels()
  const hints = await airtable.getHints()

  PUZZLES_CACHE = {}
  LEVELS_CACHE = {}
  HINTS_CACHE = {}
  SOLUTION_CACHE = {}

  levels.forEach((level) => {
    LEVELS_CACHE[level.id] = level.fields
    LEVELS_CACHE[level.id].puzzleList = []
  })

  // Cache solutions locally
  puzzles.forEach((puzzle) => {
    SOLUTION_CACHE[puzzle.id] = puzzle.fields.Solution
    PUZZLES_CACHE[puzzle.id] = puzzle.fields
    HINTS_CACHE[puzzle.id] = {}

    const levelId = puzzle.fields['Level'] ? puzzle.fields['Level'][0] : null

    if (levelId) LEVELS_CACHE[levelId].puzzleList.push(puzzle)
  })

  levels.forEach((level) => {
    LEVELS_CACHE[level.id].puzzleList.sort((a, b) => {
      return a.order - b.order
    })
  })

  hints.forEach((hint) => {
    if (hint.fields['Puzzle']) {
      const puzzleId = hint.fields['Puzzle'][0]
      HINTS_CACHE[puzzleId][hint.id] = hint.fields['HintText']
    }
  })
}

const parseSolution = (sol) => {
  return sol.replace(/[^a-zA-Z ]/g, '').toLowerCase()
}

module.exports = { app, restock }
