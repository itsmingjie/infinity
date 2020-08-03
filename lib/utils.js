const messages = require('../lib/messages')
const db = require('../services/db')

const authCheck = (admin) => async (req, res, next) => {
  if (!req.user) {
    return res.redirect(`/login?requested=true&path=${req.originalUrl}`)
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

module.exports = { authCheck }
