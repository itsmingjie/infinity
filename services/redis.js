const { times } = require('lodash')
const redis = require('redis')
const config = require('../config')
const client = redis.createClient(config.redis)

client.on('error', (error) => {
  console.error(error)
})

client.on('connect', () => {
  console.log(`Connected to Redis.`)
})

// settings cache
const cache_expiration = 10 * 60 * 1000 // in ms
let settings, timestamp

const getSettings = async () => {
  if (settings && Date.now() - timestamp <= cache_expiration) return settings
  else return await flushSettings()
}

const flushSettings = async () => {
  return new Promise((resolve, reject) => {
    client.get('settings', (err, reply) => {
      if (err) reject(err)
      else if (!reply) client.set('settings', JSON.stringify({}), redis.print)

      settings = JSON.parse(reply)
      timestamp = Date.now()
      resolve(JSON.parse(reply))
    })
  })
}

const updateSettings = (key, value) => {
  settings[key] = value
  client.set('settings', JSON.stringify(settings), redis.print)
  flushSettings()
}

module.exports = { getSettings, flushSettings, updateSettings, client }
