// Dependencies
const express = require('express')
const path = require('path')
const flash = require('connect-flash')
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const sassMiddleware = require('node-sass-middleware')
const minifyHTML = require('express-minify-html')
const compression = require('compression')
const csrf = require('csurf')
const redisStore = require('connect-redis')(session)

const app = express()
const http = require('http').createServer(app)
const helpers = require('./lib/helpers')
const passport = require('./lib/passport')
const hbs = exphbs.create({ helpers: helpers, extname: '.hbs' })
const db = require('./services/db')
const redis = require('./services/redis')
const config = require('./config')
const messages = require('./lib/messages')

let INITIALIZED = false

// Launch Server
http.listen(config.port, () => {
  console.log(`Infinity is running on *:${config.port}`)
  console.log('I hope your code works...')

  init()
})

app.use((req, res, next) => {
  if (!INITIALIZED) {
    // server not initialized yet
    res.status(502).send("The server is still initializing (it's not ready yet)! Please give it a few more seconds, and refresh the page to proceed.")
  } else {
    next()
  }
})

if (config.env !== 'development') {
  const Bugsnag = require('@bugsnag/js')
  const BugsnagPluginExpress = require('@bugsnag/plugin-express')

  // Set up Bugsnag for data capturing
  Bugsnag.start({
    apiKey: config.bugsnag.key,
    plugins: [BugsnagPluginExpress]
  })

  const bugsnag = Bugsnag.getPlugin('express')
  app.use(bugsnag.requestHandler)
  app.use(bugsnag.errorHandler)
}

app.use(
  require('body-parser').urlencoded({
    extended: true
  })
)
app.use(cookieParser())
app.use(csrf({ cookie: true }))
app.use(flash())
app.use(
  session({
    secret: config.sessionSecret,
    name: '_infinitySession',
    store: new redisStore({ client: redis.client }),
    cookie: { secure: false, maxAge: 86400000 },
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
app.use(
  minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
      minifyCSS: true
    }
  })
)
app.use(compression())

app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')
app.use(bodyParser.urlencoded({ extended: true }))

// always pass in global configs and user credentials
app.use(async (req, res, next) => {
  res.locals.team = req.user ? await db.getUser(req.user.id) : null
  res.locals.solvedList = req.user ? await db.getUserSolved(req.user.id) : null
  res.locals.global = await redis.getSettings()
  res.locals.environment = config.env
  res.locals.euler_url = config.euler_url

  next()
})

app.use(express.static(path.join(__dirname, './static')))
app.use(require('./routes/index'))

// init test
const init = () => {
  console.log('--------------------------')
  console.log('====STARTING INIT TEST====')
  console.log('--------------------------')

  Promise.all([
    require('./services/db').testConnection(),
    require('./routes/game').restock(),
    require('./routes/announcements').updateAnnouncements(),
    require('./routes/leaderboard').updateRank(),
    require('./lib/utils').eulerTest()
  ])
    .then(() => {
      INITIALIZED = true
      console.log('Init flag set to true.')
      console.log('---------------------------')
      console.log('====INIT TEST COMPLETED====')
      console.log('---------------------------')
      console.log('Nothing catastrophically wrong (yet). What a miracle.')
      console.log('Welcome to Infinity ∞, glhf!')
    })
    .catch((e) => {
      console.error(e)
      process.exit(-1)
    })
}
