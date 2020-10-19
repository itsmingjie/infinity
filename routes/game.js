/**
 * Handles all puzzle-related services
 * including listing/submission etc.
 */

const express = require('express')
const app = express.Router()
const rateLimit = require('express-rate-limit')

const db = require('../services/db')
const airtable = require('../services/airtable')
const messages = require('../lib/messages')
const flagger = require('../lib/flagger')

// solving is limited to 5 attempts per minute per IP
const solveLimiter = rateLimit({
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

  res.render('game/levels', { title: 'Levels', levels: LEVELS_CACHE })
})

app.get('/:level', cacheCheck(), (req, res) => {
  console.log('Oh look! I can pull puzzles directly from cache!')
  const level = idSearch(req.params.level, LEVELS_CACHE)

  if (level) {
    res.render('game/level', { title: level.fields.Title, level: level })
  } else {
    res.render('message', messages.notFound)
  }
})

app.get('/puzzle/:puzzle', cacheCheck(), async (req, res) => {
  console.log('Oh look! I can pull the puzzle directly from cache!')
  const puzzle = idSearch(req.params.puzzle, PUZZLES_CACHE)
  const unlockedHints = await db.getUnlockedHints(req.user.id, req.params.puzzle)

  if (puzzle) {
    res.render('game/puzzle', {
      title: `${puzzle.fields.Title} — ${puzzle.fields.Value} pts`,
      id: req.params.puzzle,
      puzzle: puzzle,
      unlockedHints: unlockedHints.map((h) => idSearch(h, HINTS_CACHE)),
      css: puzzle.fields['CustomCSS'] || false,
      solved: res.locals.solvedList.includes(req.params.puzzle),
      csrfToken: req.csrfToken()
    })
  } else {
    res.render('message', messages.notFound)
  }
})

app.post('/puzzle/:puzzle', solveLimiter, cacheCheck(), (req, res) => {
  if (!res.locals.solvedList.includes(req.params.puzzle)) {
    const puzzle = idSearch(req.params.puzzle, PUZZLES_CACHE)
    const solution = parseSolution(req.body.solution)

    if (puzzle) {
      flagger
        .validateHash(solution, SOLUTION_CACHE[req.params.puzzle])
        .then((success) => {
          // log the attempt in the database, also increments the score if applicable
          db.createAttempt(
            req.user.id,
            req.params.puzzle,
            solution,
            puzzle.fields.Value,
            success
          ).then((attempt) => {
            const attemptId = attempt.id
            const attemptTs = attempt.timestamp

            if (success) {
              db.updateScore(req.user.id, puzzle.fields.Value).then(() => {
                res.render('game/solve.hbs', {
                  title: 'Solved!',
                  success: true,
                  message: puzzle.customSuccess,
                  reference: `${attemptId} @ ${attemptTs}`
                })
              })
            } else {
              res.render('game/solve.hbs', {
                title: 'Incorrect Solution!',
                success: false,
                message: puzzle.customError,
                reference: `${attemptId} @ ${attemptTs}`
              })
            }
          })
        })
    } else {
      res.render('message', messages.notFound)
    }
  } else {
    res.render('message', messages.caughtRedHanded)
  }
})

app.get(
  '/puzzle/:puzzle/hint/:hint',
  solveLimiter,
  cacheCheck(),
  async (req, res) => {
    const userCredits = await db.getHintCredit(req.user.id)
    const unlockedHints = await db.getUnlockedHints(req.user.id, req.params.puzzle)

    if (unlockedHints.includes(req.params.hint)) {
      res.render('message', messages.hintAlreadyUnlocked)
    } else if (userCredits < 1) {
      res.render('message', messages.outOfHintCredit)
    } else {
      db.createHintIntent(req.user.id, req.params.puzzle, req.params.hint, 0)
        .then(() => {
          res.redirect(req.get('referer') + "#" + req.params.hint)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }
)

// repull information from Airtable to memory
// note: always restock both caches together to prevent data mismatch
const restock = async () => {
  PUZZLES_CACHE = await airtable.getUnlockedPuzzles(true)
  LEVELS_CACHE = await airtable.getLevels()
  HINTS_CACHE = await airtable.getHints()
  SOLUTION_CACHE = {}

  LEVELS_CACHE.forEach((level) => {
    if (level.fields.Puzzles) {
      level.fields.Puzzles = mergeMeta(
        level.fields.Puzzles,
        level.fields.PuzzleNames,
        level.fields.PuzzleDescriptions,
        level.fields.PuzzleValues,
        level.fields.PuzzleLocks,
        level.fields.PuzzleOrders
      )
    }
  })

  // Cache solutions locally
  PUZZLES_CACHE.forEach((puzzle) => {
    SOLUTION_CACHE[puzzle.id] = puzzle.fields.Solution
  })
}

const idSearch = (id, root) => {
  for (var i = 0; i < root.length; i++) {
    if (root[i].id === id) {
      return root[i]
    }
  }

  return null
}

const mergeMeta = (ids, titles, descriptions, values, locks, orders) => {
  const r = []

  for (let i = 0; i < ids.length; i++) {
    r.push({
      id: ids[i],
      title: titles[i],
      description: descriptions[i],
      value: values[i],
      unlocked: locks[i],
      order: orders[i]
    })
  }

  // sort array objects by data passed in
  return r.sort((a, b) => {
    return a.order - b.order
  })
}

const parseSolution = (sol) => {
  return sol.replace(/[^a-zA-Z ]/g, '').toLowerCase()
}

module.exports = { app, restock }
