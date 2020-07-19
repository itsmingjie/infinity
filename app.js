// Dependencies
const express = require('express')
const path = require('path')
const flash = require('connect-flash')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')

const app = express()
const http = require('http').createServer(app)
const helpers = require('./lib/helpers')
const passport = require('./lib/passport')
const hbs = exphbs.create({ helpers: helpers, extname: '.hbs' })
const config = require('./config')

app.use(
  require('body-parser').urlencoded({
    extended: true
  })
)
app.use(cookieParser())
app.use(flash())
app.use(
  session({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/login', (req, res) => {
  console.log(req.isAuthenticated())
  if (req.isAuthenticated()) {
    res.redirect('/dashboard')
  } else {
    res.render('login', { title: 'Login' })
  }
})

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' })
})

const apiRouter = express.Router()
app.use('/api', apiRouter)

// All account-related operations
apiRouter.use('/account', require('./routes/account'))

// Launch Server
http.listen(config.port, () => {
  console.log(`Infinity is running on *:${config.port}`)
})
