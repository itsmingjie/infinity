const express = require('express')
const app = express.Router()

app.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard' })
})

module.exports = app
