const express = require('express')
const app = express.Router()
const rateLimit = require('express-rate-limit')
const LimitStore = require('rate-limit-redis')

const fs = require('fs')
const sanitize = require('sanitize-filename')
const path = require('path')
const marked = require('marked')

const messages = require('../lib/messages')
const redisClient = require('../services/redis').client

const limiter = rateLimit({
  store: new LimitStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 1 minute
  max: 200 // limit each IP to 10 attempts per minute
})

app.use(limiter)

const PAGES = {
  credits: 'Platform Credits',
  stuck: 'Feeling Stuck?'
}

app.get('/:pagename', (req, res) => {
  const pagename = sanitize(req.params.pagename)

  fs.readFile(
    path.join(__dirname, `../pages/${pagename}.md`),
    'utf8',
    (err, data) => {
      if (err) {
        res.render('message', messages.notFound)
      } else {
        res.render('page', {
          title:
            PAGES[pagename] ||
            pagename
              .toLowerCase()
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' '),
          content: data
        })
      }
    }
  )
})

module.exports = app
