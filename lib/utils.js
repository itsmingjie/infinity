const adminOnly = () => (req, res, next) => {
  console.log(req.user)
  if (!req.user) {
    return res.redirect('/login')
  } else if (!req.user.isAdmin) {
    return res.render('error', {
      error:
        'You must be an admin to view this page. If you believe this is an error, please reach out to tech.',
      title: 'Error: Unauthorized'
    })
  }

  return next()
}

module.exports = { adminOnly }
