const express = require('express')
const app = express.Router()

const utils = require('../lib/utils')

app.get('/', (req, res) => {
  res.render('landing', {
    title: 'Infinity ∞',
    heroSize: 'fullheight'
  })
})

app.use('/game', utils.authCheck(false), require('./game'))
app.use('/admin', utils.authCheck(true), require('./admin'))
app.use('/account', require('./account'))

module.exports = app
