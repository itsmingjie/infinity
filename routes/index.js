const express = require('express')
const app = express.Router()

const utils = require('../lib/utils')

app.get('/', (req, res) => {
  res.render('landing', {
    title: 'Welcome — ' + res.locals.global.gameName
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
app.use('/leaderboard', utils.lockdownCheck('leaderboardLockdown', true),require('./leaderboard').app)

module.exports = app
