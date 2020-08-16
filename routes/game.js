/**
 * Handles all puzzle-related services
 * including listing/submission etc.
 */

const express = require('express')
const app = express.Router()
const db = require('../services/db')
const airtable = require('../services/airtable')
const messages = require('../lib/messages')

// Cached in memory
let PUZZLES_CACHE, LEVELS_CACHE

// middleware to check for valid cache
const cacheCheck = () => (req, res, next) => {
  if (
    typeof PUZZLES_CACHE === 'undefined' ||
    typeof LEVELS_CACHE === 'undefined'
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

app.get('/puzzle/:puzzle', cacheCheck(), (req, res) => {
  console.log('Oh look! I can pull the puzzle directly from cache!')
  const puzzle = idSearch(req.params.puzzle, PUZZLES_CACHE)

  if (puzzle) {
    res.render('game/puzzle', {
      title: `${puzzle.fields.Title} — ${puzzle.fields.Value} pts`,
      puzzle: puzzle,
      csrfToken: req.csrfToken()
    })
  } else {
    res.render('message', messages.notFound)
  }
})

// repull information from Airtable to memory
// note: always restock both caches together to prevent data mismatch
const restock = async () => {
  PUZZLES_CACHE = await airtable.getUnlockedPuzzles()
  LEVELS_CACHE = await airtable.getLevels()

  LEVELS_CACHE.forEach((level) => {
    if (level.fields.Puzzles) {
      level.fields.Puzzles = mergeMeta(
        level.fields.Puzzles,
        level.fields.PuzzleNames,
        level.fields.PuzzleDescriptions,
        level.fields.PuzzleValues,
        level.fields.PuzzleLocks
      )
    }
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

const mergeMeta = (ids, titles, descriptions, values, locks) => {
  const r = []

  for (let i = 0; i < ids.length; i++) {
    const t = {}

    t.id = ids[i]
    t.title = titles[i]
    t.description = descriptions[i]
    t.value = values[i]
    t.unlocked = locks[i]

    r.push(t)
  }

  return r
}

module.exports = { app, restock }
