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
let settings

const getSettings = async () => {
  // if (settings) return settings
  // else return await flushSettings()
  return await flushSettings()
}

const flushSettings = async () => {
  return new Promise((resolve, reject) => {
    client.get('settings', (err, reply) => {
      if (err) reject(err)
      else if (!reply) client.set('settings', JSON.stringify({}), redis.print)

      settings = JSON.parse(reply)
      resolve(JSON.parse(reply))
    })
  })
}

const updateSettings = async (key, value) => {
  settings[key] = value
  client.set('settings', JSON.stringify(settings), redis.print)

  return await flushSettings()
}

module.exports = { getSettings, flushSettings, updateSettings, client }
