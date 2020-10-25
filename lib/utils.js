const fetch = require('node-fetch')
const url = require('url')

const messages = require('../lib/messages')
const db = require('../services/db')
const config = require('../config')

const authCheck = (admin) => async (req, res, next) => {
  if (!req.user) {
    return res.redirect(`/account/login?requested=true&path=${req.originalUrl}`)
  } else {
    const user = await db.getUser(req.user.id)
    if (admin) {
      // requires admin privileges
      if (!user.isAdmin) {
        return res.render('message', messages.unauthorizedAdmin)
      }
    } else if (user.isBanned) {
      return res.render('message', messages.banned)
    }
  }

  // skipped
  return next()
}

const lockdownCheck = (flag, adminBypass) => async (req, res, next) => {
  if (res.locals.global[flag]) {
    if (adminBypass && res.locals.team && res.locals.team.isAdmin) {
      // bypassed admin
      res.locals.bypassed = flag
      next()
    } else {
      res.render('message', messages.lockdown)
    }
  } else {
    next()
  }
}

// checks if the Euler platform is valid
const eulerTest = () => {
  return new Promise((resolve, reject) => {
    fetch(url.resolve(config.euler_url, '/api/ping'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.euler_token
      }
    })
      .then((data) => data.text())
      .then((res) => {
        if (res === "pong") {
          console.log('Euler server says "pong".')
          resolve()
        } else {
          console.error('The Euler server is not responding correctly. Check your URL and auth token?')
          process.exit(-1)
        }
      })
      .catch((err) => {
        console.error('The Euler URL is invalid, or the server is not running.')
        process.exit(-1)
      })
  })
}

module.exports = { authCheck, lockdownCheck, eulerTest }
