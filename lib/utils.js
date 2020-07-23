const authCheck = (admin) => (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login')
  } else if (admin) {
    // requires admin privileges
    if (!req.user.isAdmin) {
      return res.render('message', {
        message:
          'You must be an admin to view this page. If you believe this is an error, please reach out to tech.',
        title: 'Error: Unauthorized'
      })
    }
  }

  // skipped
  return next()
}

module.exports = { authCheck }
