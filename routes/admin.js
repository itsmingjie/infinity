const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const url = require('url')

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

app.get('/customization', (req, res) => {
  res.render('admin/customization', { title: 'Customization' })
})

app.get('/lockdown', (req, res) => {
  res.render('admin/lockdown', { title: 'Lockdown' })
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

app.post('/update', (req, res) => {
  const prop = req.body.prop
  const value = req.body.value
  const redis = require('../services/redis')

  redis
    .updateSettings(prop, value)
    .then(async () => {
      res.locals.global = await redis.getSettings()
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

app.get('/announcement', (req, res) => {
  res.render('admin/announcement', { title: 'Announcement' })
})

app.post('/announcement', (req, res) => {
  const title = req.body.title
  const content = req.body.content

  db.createAnnouncement(title, content, res.locals.team.display_name).then(
    (id) => {
      fetch(url.resolve(config.euler_url, '/api/announcement'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: config.euler_token
        },
        body: JSON.stringify({
          id
        })
      })
        .then((data) => data.json())
        .then((result) => {
          require('./announcements')
            .updateAnnouncements()
            .then(() => {
              res.redirect('/announcements/' + id)
            })
        })
    }
  )
})

app.get('/ban/:id', (req, res) => {
  const uid = req.params.id
  db.banUser(uid, true, res.locals.team.name)

  res.render('message', messages.success)
})

app.get('/unban/:id', (req, res) => {
  const uid = req.params.id
  db.banUser(uid, false, res.locals.team.name)

  res.render('message', messages.success)
})

app.get('/alert', (req, res) => {
  res.render('admin/alert', { title: 'Alert Team' })
})

app.post('/alert', (req, res) => {
  const id = req.body.id
  const message = req.body.message

  fetch(url.resolve(config.euler_url, '/api/alert'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.euler_token
    },
    body: JSON.stringify({
      id,
      message
    })
  })
    .then((data) => data.json())
    .then((result) => {
      res.render('message', result)
    })
    .catch((err) => {
      console.log(err)
    })
})

module.exports = app
