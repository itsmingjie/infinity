/**
 * Handles all account-related services
 * including registration/login/reset/etc
 */

const express = require('express')
const app = express.Router()
const db = require('../services/db')
const passport = require('../lib/passport')

// Temporary route strictly for internal use, remove later
app.post('/create', (req, res) => {
  const name = req.body.name
  const password = req.body.password

  db.createUser(name, password)
    .then(() => {
      res.send('Success')
    })
    .catch((e) => {
      res.render('error', { error: e, title: 'Error' })
    })
})

app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
  }),
  (req, res) => {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000
    } else {
      req.session.cookie.expires = false
    }

    res.redirect('/')
  }
)
module.exports = app
