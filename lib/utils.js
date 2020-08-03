const messages = require('../lib/messages')

const authCheck = (admin) => (req, res, next) => {
  if (!req.user) {
    return res.redirect(`/login?requested=true&path=${req.originalUrl}`)
  } else if (admin) {
    // requires admin privileges
    if (!req.user.isAdmin) {
      return res.render('message', messages.unauthorizedAdmin)
    }
  }
  // skipped
  return next()
}

module.exports = { authCheck }
