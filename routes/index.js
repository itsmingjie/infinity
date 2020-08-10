const express = require('express')
const app = express.Router()
const redis = require('../services/redis')

const utils = require('../lib/utils')

app.get('/', (req, res) => {
  res.render('landing', {
    title: res.locals.global.gameName
  })
})

app.use(
  '/game',
  utils.authCheck(false),
  utils.lockdownCheck('puzzleLockdown', false),
  require('./game').app
)
app.use('/admin', utils.authCheck(true), require('./admin'))
app.use('/account', require('./account'))
app.use('/page', require('./page'))

module.exports = app
