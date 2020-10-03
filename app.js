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
const asciify = require('asciify-image')
const csrf = require('csurf')

const app = express()
const http = require('http').createServer(app)
const helpers = require('./lib/helpers')
const passport = require('./lib/passport')
const hbs = exphbs.create({ helpers: helpers, extname: '.hbs' })
const db = require('./services/db')
const redis = require('./services/redis')
const config = require('./config')

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

  next()
})

app.use(express.static(path.join(__dirname, './static')))

app.use(require('./routes/index'))

// Launch Server
http.listen(config.port, () => {
  asciify(
    './static/assets/images/infinity.png',
    {
      fit: 'box',
      width: 15,
      height: 15
    },
    (err, asciified) => {
      if (err) throw err

      console.log(asciified)
      console.log('\n')
      console.log(`Infinity is running on *:${config.port}`)
    }
  )
})
