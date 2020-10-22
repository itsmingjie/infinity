const express = require('express')
const app = express.Router()

const utils = require('../lib/utils')
const messages = require('../lib/messages')

app.get('/', (req, res) => {
  res.render('landing', {
    layout: 'landing',
    title: res.locals.global.gameName,
    tagline: res.locals.global.tagline
  })
})

app.use(
  '/game',
  utils.authCheck(false),
  utils.lockdownCheck('puzzleLockdown', true),
  require('./game').app
)
app.use('/admin', utils.authCheck(true), require('./admin'))
app.use('/account', require('./account'))
app.use('/page', require('./page'))
app.use('/announcements', require('./announcements').app)
app.use(
  '/leaderboard',
  utils.lockdownCheck('leaderboardLockdown', true),
  require('./leaderboard').app
)

// Error handling routes

app.use((req, res) => {
  res.status(404).render('message', messages.notFound)
})
app.use((error, req, res, next) => {
  res.status(500).render('message', messages.serverError)
});

module.exports = app
