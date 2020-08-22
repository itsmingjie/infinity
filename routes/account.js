/**
 * Handles all account-related services
 * including registration/login/reset/etc
 */

const express = require('express')
const app = express.Router()
const rateLimit = require('express-rate-limit')

const config = require('../config')
const db = require('../services/db')
const recaptcha = require('../services/recaptcha')
const utils = require('../lib/utils')
const passport = require('../lib/passport')
const messages = require('../lib/messages')

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10 // limit each IP to 10 attempts per minute
})

app.use(limiter)

const captchaFlagMiddleware = (req, res, next) => {
  if (req.recaptcha.error) {
    res.render('message', messages.captchaError)
  } else {
    return next()
  }
}

// always pass in global configs and user credentials
app.use(async (req, res, next) => {
  res.locals.csrfToken = req.csrfToken()

  next()
})

app.get('/', utils.authCheck(false), (req, res) => {
  res.render('account/team', { title: 'Team Profile' })
})

app.get('/login', (req, res) => {
  const requested = req.query.requested
  const path = req.query.path
  const loginFailure = req.query.loginFailure

  if (req.isAuthenticated()) {
    res.redirect('/account')
  } else {
    res.render('account/login', {
      title: 'Login',
      captcha: config.recaptcha.site,
      loginFailure: loginFailure,
      requested: requested,
      path: path
    })
  }
})

app.get(
  '/register',
  utils.lockdownCheck('registrationLockdown', true),
  (req, res) => {
    res.render('account/register', {
      title: 'Register',
      captcha: config.recaptcha.site
    })
  }
)

app.post(
  '/create',
  recaptcha.middleware.verify,
  captchaFlagMiddleware,
  utils.lockdownCheck('registrationLockdown', true),
  (req, res) => {
    const name = req.body.name
    const password = req.body.password

    //if (name.indexOf('team_') === 0 && password !== '') {
    if (password !== '') {
      db.createUser(name, password)
        .then(() => {
          res.render('message', {
            message:
              'Your account has been registered successfully. You may now proceed to log in.',
            title: 'Registration Completed'
          })
        })
        .catch((e) => {
          res.render('message', { message: e, title: 'Error' })
        })
    } else {
      res.render('message', {
        message: 'Invalid account details. Password must not be empty.',
        title: 'Error'
      })
    }
  }
)

app.get('/logout', function (req, res) {
  req.logout()
  res.redirect('/')
})

app.post(
  '/login',
  recaptcha.middleware.verify,
  captchaFlagMiddleware,
  passport.authenticate('local', {
    failureRedirect: '/account/login/?loginFailure=true'
  }),
  (req, res) => {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000
    } else {
      req.session.cookie.expires = false
    }

    res.redirect(req.body.redirectURL || '/')
  }
)

app.post(
  '/update',
  passport.authenticate('local', {
    successRedirect: '/account',
    failureRedirect: '/account/login'
  }),
  (req, res) => {
    const id = req.query.id

    if (id !== req.user.id && !req.user.isAdmin) {
      // unauthorized access
      res.render('message', messages.unauthorizedAdmin)
    } else {
      const data = {}
      if (req.user.isAdmin) {
        // elevated control (includes permission settings)
        data.admin = req.body.admin
        data.verified = req.body.verified
      }

      // general user control
      data.displayName = req.body.displayName
      data.affiliation = req.body.affiliation
    }
  }
)

module.exports = app
