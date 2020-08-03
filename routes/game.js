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
  console.log('Oh look! I can pull puzzles directly from cache!')

  res.render('game/levels', { title: 'Levels', levels: LEVELS_CACHE })
})

app.get('/debug/levels', (req, res) => {
  res.json(LEVELS_CACHE)
})

// repull information from Airtable to memory
// note: always restock both caches together to prevent data mismatch
const restock = async () => {
  PUZZLES_CACHE = await airtable.getUnlockedPuzzles()
  LEVELS_CACHE = await airtable.getLevels()
}

module.exports = app
