const messages = require('../lib/messages')
const db = require('../services/db')

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

module.exports = { authCheck, lockdownCheck }
