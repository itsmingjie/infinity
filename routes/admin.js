const express = require('express')
const bodyParser = require('body-parser')

const app = express.Router()

const restock = require('../routes/game').restock
const flagger = require('../lib/flagger')
const db = require('../services/db')
const config = require('../config')
const messages = require('../lib/messages')

app.use(bodyParser.json())
app.use(async (req, res, next) => {
  res.locals.layout = 'admin'
  res.locals.csrfToken = req.csrfToken()

  next()
})

app.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Dashboard' })
})

app.get('/puzzles', (req, res) => {
  res.render('admin/puzzles', {
    title: 'Puzzles',
    airtable: config.airtable.base
  })
})

app.get('/flaggen', (req, res) => {
  res.render('admin/flaggen', { title: 'Flag Generator' })
})

app.post('/flaggen', (req, res) => {
  flagger.getHashBatch(req.body.solutions).then((hash) => {
    res.json({
      success: true,
      encrypted: hash
    })
  })
})

app.get('/teams', (req, res) => {
  db.listAllUsers().then((data) => {
    res.render('admin/teams', { title: 'Team Management', teams: data })
  })
})

app.get('/homepage', (req, res) => {
  res.render('admin/homepage', { title: 'Homepage' })
})

app.post('/update', (req, res) => {
  const prop = req.body.prop
  const value = req.body.value

  require('../services/redis')
    .updateSettings(prop, value)
    .then(() => {
      res.send('OK')
      console.log('Success')
    })
    .catch((err) => {
      res.status(500).send(err)
    })
})

app.get('/restock', (req, res) => {
  restock()
  res.send('Success!')
})

app.get('/logs', (req, res) => {
  Promise.all([db.listUserIds(), db.listAllLogs()]).then((data) => {
    const users = data[0]
    const logs = data[1]

    res.render('admin/logs', { title: 'Action Logs', logs: logs, users: users })
  })
})

app.get('/logs/export', (req, res) => {
  db.exportLogs(res)
})

app.get('/hints', (req, res) => {
  res.render('admin/hints', { title: 'Hints' })
})

app.post('/hints/bump', (req, res) => {
  db.giveHintCredit(res.locals.team.id, req.body.uid, req.body.amount)

  res.render('message', messages.hintDistributed)
})

module.exports = app
