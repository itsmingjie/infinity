const express = require('express')
const app = express.Router()

const fs = require('fs')
const path = require('path')
const showdown = require('showdown')
const converter = new showdown.Converter()

const messages = require('../lib/messages')

app.get('/:pagename', (req, res) => {
  const pagename = req.params.pagename

  fs.readFile(
    path.join(__dirname, `../pages/${pagename}.md`),
    'utf8',
    (err, data) => {
      if (err) {
        res.render('message', messages.notFound)
      } else {
        res.render('page', {
          layout: 'page',
          content: converter.makeHtml(data)
        })
      }
    }
  )
})

module.exports = app
