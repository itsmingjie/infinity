/**
 * Initializes the passport suite globally
 */

const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const db = require('../services/db')

passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'name',
      passReqToCallback: true
    },
    (req, username, password, done) => {
      const loginAttempt = () => {
        db.validateUser(username, password)
          .then((user) => done(null, user))
          .catch((e) => done(null, false))
      }

      loginAttempt()
    }
  )
)

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  done(null, user)
})

module.exports = passport
