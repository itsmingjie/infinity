/**
 * Handles all account-related services
 * including registration/login/reset/etc
 */

const express = require('express')
const app = express.Router()
const rateLimit = require('express-rate-limit')
const bodyParser = require('body-parser')
const requestIp = require('request-ip')
const LimitStore = require('rate-limit-redis')

const config = require('../config')
const db = require('../services/db')
const recaptcha = require('../services/recaptcha')
const utils = require('../lib/utils')
const passport = require('../lib/passport')
const messages = require('../lib/messages')
const divisions = require('../lib/divisions')
const redisClient = require('../services/redis').client
const discord = require('../services/discord')

const limiter = rateLimit({
  store: new LimitStore({
    client: redisClient
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 50 // limit each IP to 10 attempts per minute
})

app.use(bodyParser.json())

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
      divisions: Object.entries(divisions)
        .map((arr) => arr[1][1])
        .slice(1),
      captcha: config.recaptcha.site
    })
  }
)

app.post(
  '/create',
  limiter,
  recaptcha.middleware.verify,
  captchaFlagMiddleware,
  utils.lockdownCheck('registrationLockdown', true),
  (req, res) => {
    const name = req.body.name
    const password = req.body.password
    const division = req.body.division
    const affiliation = req.body.affiliation || ''
    const display_name = req.body.display_name

    const usernamePattern = new RegExp(/[ !@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?]/g)

    if (usernamePattern.test(name)) {
      return res.render('message', {
        message:
          'Invalid account details. Username cannot contain special characters.',
        title: 'Error'
      })
    }

    //if (name.indexOf('team_') === 0 && password !== '') {
    if (password !== '') {
      db.createUser(name, password, division, affiliation, display_name)
        .then(() => {
          discord.push(`☀ New team ${name} [${display_name}] ${affiliation ? `with affiliation ${affiliation}` : ""} just registered for division ${division}!`)

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
  limiter,
  recaptcha.middleware.verify,
  captchaFlagMiddleware,
  passport.authenticate('local', {
    failureRedirect: '/account/login/?loginFailure=true'
  }),
  (req, res) => {
    if (req.body.remember) {
      const hours = 48 // cookie expiration
      req.session.cookie.maxAge = 360000 * hours
    } else {
      req.session.cookie.expires = false
    }

    if (config.env !== 'development') {
      db.logSignin(req.user.id, requestIp.getClientIp(req))
      discord.push(`👋 **${req.body.name}** logged in from ${requestIp.getClientIp(req)}`)
    }

    res.redirect(req.body.redirectURL || '/')
  }
)

const KEY_DICT = {
  affiliation: 'affiliation',
  emails: 'emails'
}

app.post('/update', limiter, (req, res) => {
  const id = req.body.id || req.user.id
  const db_key = KEY_DICT[req.body.key] // the key of the database to update
  let value = req.body.value

  if (id !== req.user.id && !req.user.isAdmin) {
    // unauthorized access
    res.status(403)
  } else if (db_key === undefined) {
    // user trying to update a key that is not update-able
    res.status(403)
  } else {
    if (db_key === 'emails') {
      // split emails into an array by line
      value = value
        .replace(/\|/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, '|')
        .toLowerCase()

      // test if emails are valid
      const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
      const value_arr = value.split('|')

      for (i in value_arr) {
        if (!re.test(value_arr[i])) {
          res.status(400).json({
            line: value_arr[i]
          })
          return
        }
      }
    }

    db.updateUser(id, db_key, value)
      .then((r) => {
        res.status(200).send()
      })
      .catch((err) => {
        console.log(err)
        res.status(500).json(err)
      })
  }
})

module.exports = app
