
const express = require('express')
const app = express.Router()

const db = require('../services/db')
const divisions = require('../lib/divisions')
const { range } = require('lodash')

const CACHE_TIMEOUT = 30 * 60 * 1000 // in ms

let RANK_CACHE

app.use(async (req, res, next) => {
    if (!RANK_CACHE || (Date.now() - RANK_CACHE.ts) > CACHE_TIMEOUT)
        await updateRank()
    
    next()
})

app.get('/', (req, res) => {
    const currentDiv = res.locals.team ? res.locals.team.division : 1
    res.redirect('/leaderboard/division/' + currentDiv)
})

app.get('/division/:id', (req, res) => {
    const updated = RANK_CACHE.ts
    const ranked = RANK_CACHE.leaderboard[Number(req.params.id)]

    const name = ranked.name
    const board = ranked.board

    res.render('leaderboard/rank', { title: 'Leaderboard: ' + name, board, updated, timeout: CACHE_TIMEOUT })
})

const updateRank = async () => {
    console.log("Refreshing leaderboard...")

    const leaderboard = {}

    for (const [k, v] of Object.entries(divisions)) {
        leaderboard[k] = {
            name: divisions[k][1],
            board: await db.listUserByDivisions(k)
        }
    }

    RANK_CACHE = {
        ts: Date.now(),
        leaderboard
    }
}

module.exports = app