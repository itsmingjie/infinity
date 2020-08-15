const express = require('express')
const bodyParser = require('body-parser')

const app = express.Router()

const restock = require('../routes/game').restock
const flagger = require('../lib/flagger')

app.use(bodyParser.json())
app.use(async (req, res, next) => {
  res.locals.layout = 'admin'

  next()
})

app.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Dashboard' })
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

module.exports = app
