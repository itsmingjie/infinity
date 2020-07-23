// Dependencies
const express = require('express')
const path = require('path')
const flash = require('connect-flash')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const sassMiddleware = require('node-sass-middleware')

const app = express()
const http = require('http').createServer(app)
const helpers = require('./lib/helpers')
const passport = require('./lib/passport')
const utils = require('./lib/utils')
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
app.use(
  sassMiddleware({
    src: path.join(__dirname, './styles'),
    dest: path.join(__dirname, './static/assets/styles'),
    outputStyle: 'compressed',
    prefix: '/assets/styles/'
  })
)
app.use(passport.initialize())
app.use(passport.session())

app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')
app.use(bodyParser.urlencoded({ extended: true }))

// always pass in the user credentials
app.use((req, res, next) => {
  res.locals.team = req.user
  next()
})

app.use(express.static(path.join(__dirname, './static')))

app.get('/', (req, res) => {
  res.render('landing', {
    title: 'Infinity ∞',
    heroSize: 'fullheight'
  })
})

app.get('/login', (req, res) => {
  console.log(req.isAuthenticated())
  if (req.isAuthenticated()) {
    res.redirect('/dashboard')
  } else {
    res.render('account/login', { title: 'Login' })
  }
})

app.get('/register', (req, res) => {
  res.render('account/register', { title: 'Register' })
})

app.get('/team', utils.authCheck(false), (req, res) => {
  res.render('account/team', { title: 'Team Profile' })
})

app.get('/logout', (req, res) => {
  res.redirect('/api/account/logout')
})

const apiRouter = express.Router()
app.use('/api', apiRouter)

// All account-related operations
apiRouter.use('/account', require('./routes/account'))

const adminRouter = express.Router()
app.use('/admin', utils.authCheck(true), adminRouter)

adminRouter.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Dashboard' })
})

// Launch Server
http.listen(config.port, () => {
  console.log(`Infinity is running on *:${config.port}`)
})
