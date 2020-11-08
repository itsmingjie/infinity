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
const networkInterfaces = require('os').networkInterfaces

const app = express()
const http = require('http').createServer(app)
const helpers = require('./lib/helpers')
const passport = require('./lib/passport')
const hbs = exphbs.create({ helpers: helpers, extname: '.hbs' })
const db = require('./services/db')
const redis = require('./services/redis')
const config = require('./config')
const messages = require('./lib/messages')
const discord = require('./services/discord')

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

if (config.env !== 'development') {
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
}

app.engine('.hbs', hbs.engine)
app.set('view engine', '.hbs')
app.use(bodyParser.urlencoded({ extended: true }))

const getLocalExternalIP = () =>
  []
    .concat(...Object.values(networkInterfaces()))
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .pop().address

const systemHash = Buffer.from(getLocalExternalIP()).toString('base64').replace("=", "").toUpperCase().substring(6)

// always pass in global configs and user credentials
app.use(async (req, res, next) => {
  res.locals.team = req.user ? await db.getUser(req.user.id) : null
  res.locals.solvedList = req.user ? await db.getUserSolved(req.user.id) : null
  res.locals.global = await redis.getSettings()
  res.locals.environment = config.env
  res.locals.euler_url = config.euler_url
  res.locals.node_id = systemHash

  next()
})

// Easter egg, feel free to disable
app.post('/egg/key', bodyParser.json(), (req, res) => {
  if (req.body.key === config.meta.key) {
      discord.push(`🎉 **${res.locals.team ? res.locals.team.display_name : "Unlogged Guest"}** solved the \`FOUND\` meta-meta!!!`)
  }

  res.json({
    success: req.body.key === config.meta.key,
    solution: req.body.key === config.meta.key ? config.meta.solution : null
  })
})

app.use(express.static(path.join(__dirname, './static')))
app.use(require('./routes/index'))

// Launch Server
http.listen(config.port, () => {
  console.log(`Infinity is running on *:${config.port}`)
  console.log('I hope your code works...')

  console.log('--------------------------')
  console.log('====STARTING INIT TEST====')
  console.log('--------------------------')

  Promise.all([
    require('./services/db').testConnection(),
    require('./services/redis').getSettings(),
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
})
