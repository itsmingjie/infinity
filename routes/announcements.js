const express = require('express')
const app = express.Router()

const db = require('../services/db')
const messages = require('../lib/messages')

let ANNOUNCEMENT_CACHE

app.use(async (req, res, next) => {
  if (!ANNOUNCEMENT_CACHE) await updateAnnouncements()

  next()
})

app.get('/', (req, res) => {
  res.render('announcements/list', {
    title: 'Announcements',
    announcements: ANNOUNCEMENT_CACHE
  })
})

app.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  const announcement = idSearch(id, ANNOUNCEMENT_CACHE)

  if (announcement) {
    res.render('announcements/single', announcement)
  } else {
    res.render('message', messages.notFound)
  }
})

const updateAnnouncements = async () => {
  console.log('Refreshing announcements...')
  ANNOUNCEMENT_CACHE = await db.getAnnouncements()

  console.log(`Announcements updated, found ${ANNOUNCEMENT_CACHE.length} announcements.`)
}

const idSearch = (id, root) => {
  for (var i = 0; i < root.length; i++) {
    if (root[i].id === id) {
      return root[i]
    }
  }

  return null
}

module.exports = { app, updateAnnouncements }
