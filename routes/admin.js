const express = require('express')
const bodyParser = require('body-parser')

const app = express.Router()
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' })
})

app.post('/update', (req, res) => {
  console.log(req.body)

  const prop = req.body.prop
  const value = req.body.value

  console.log(prop)
  console.log(value)

  res.send('OK')
})

module.exports = app
