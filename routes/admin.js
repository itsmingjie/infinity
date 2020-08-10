const express = require('express')
const bodyParser = require('body-parser')

const app = express.Router()

const restock = require('../routes/game').restock

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' })
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
