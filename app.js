// Dependencies
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const app = express()
const http = require('http').createServer(app)

// Import all env variables from .env
require('dotenv').config()

// Configuration Data
const port = process.env.PORT || 3000

app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

// Launch Server
http.listen(port, () => {
  console.log(`Infinity is running on *:${port}`)
})
