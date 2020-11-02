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
const { forEach } = require('lodash')
const redisClient = require('../services/redis').client

app.use(bodyParser.json())

// solving is limited to 5 attempts per minute per team
const solveLimiter = rateLimit({
  store: new LimitStore({
    client: redisClient
  }),
  keyGenerator: function (req) {
    return req.user.id
  },
  windowMs: 60 * 1000, // 1 minute
  max: 5 // limit each IP to 10 attempts per minute
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
      metas: level.Meta
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
  if (!res.locals.solvedList.includes(req.params.puzzle)) {
    const puzzle = PUZZLES_CACHE[req.params.puzzle]
    const solution = parseSolution(req.body.solution)

    if (puzzle) {
      const isMeta = puzzle.meta // whether the puzzle is a metapuzzle

      flagger
        .validateHash(solution, SOLUTION_CACHE[req.params.puzzle])
        .then((success) => {
          // log the attempt in the database, also increments the score if applicable
          db.createAttempt(
            req.user.id,
            req.params.puzzle,
            solution,
            puzzle.Value,
            success
          )
            .then((attempt) => {
              const attemptId = attempt.id
              const attemptTs = attempt.timestamp

              if (success) {
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
                res.json({
                  success: false,
                  message: puzzle.CustomError || 'Try again next time?',
                  reference: `${attemptId} @ ${attemptTs}`
                })
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
      res.json({
        success: false,
        message: messages.notFound.message
      })
    }
  } else {
    res.json({
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
    const puzzleId = hint.fields['Puzzle'][0]
    HINTS_CACHE[puzzleId][hint.id] = hint.fields['HintText']
  })
}

const parseSolution = (sol) => {
  return sol.replace(/[^a-zA-Z ]/g, '').toLowerCase()
}

module.exports = { app, restock }
