const express = require('express')
const app = express.Router()

const db = require('../services/db')
const divisions = require('../lib/divisions')
const config = require('../config')

const CACHE_TIMEOUT = 5 * 60 * 1000 // in ms

let RANK_CACHE

app.use(async (req, res, next) => {
  if (!RANK_CACHE || Date.now() - RANK_CACHE.ts > CACHE_TIMEOUT) updateRank()

  res.locals.divisions = Object.entries(divisions)
    .map((arr) => arr[1][1])
    .slice(1)

  next()
})

app.get('/', (req, res) => {
  const currentDiv = res.locals.team
    ? res.locals.team.division === 0
      ? 1
      : res.locals.team.division
    : 1

  res.redirect('/leaderboard/division/' + currentDiv)
})

app.get('/division', (req, res) => {
  res.redirect('/leaderboard')
})

app.get('/division/:id', (req, res) => {
  const updated = RANK_CACHE.ts
  const ranked = RANK_CACHE.leaderboard[Number(req.params.id)]

  if (!ranked) {
    res.render('message', messages.notFound)
    return
  }

  const name = ranked.name
  const board = ranked.board
  const isRanked = divisions[Number(req.params.id)][3]

  res.render('leaderboard/rank', {
    title: `Leaderboard: ${name} Division`,
    board: isRanked
      ? board
      : board.sort((a, b) => a.display_name.localeCompare(b.display_name)),
    updated,
    timeout: CACHE_TIMEOUT,
    totalScore: config.total_score,
    ranked: isRanked
  })
})

const updateRank = async () => {
  console.log('Refreshing leaderboard...')

  const leaderboard = {}

  for (const [k, v] of Object.entries(divisions)) {
    if (k != 0) {
      leaderboard[k] = {
        name: divisions[k][1],
        board: await db.listUserByDivisions(k)
      }
    }
  }

  RANK_CACHE = {
    ts: Date.now(),
    leaderboard
  }

  console.log(`Leaderboard refreshed at ${RANK_CACHE.ts}.`)
}

module.exports = { app, updateRank }
