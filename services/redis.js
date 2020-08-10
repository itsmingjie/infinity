const redis = require('redis')
const config = require('../config')
const client = redis.createClient(config.redis)

client.on('error', (error) => {
  console.error(error)
})

client.on('connect', () => {
  console.log(`The Redis instance at ${client.address} has been connected.`)
})

// settings cache
let settings

const getSettings = async () => {
  if (settings) return settings
  else return await flushSettings()
}

const flushSettings = () => {
  return new Promise((resolve, reject) => {
    client.get('settings', (err, reply) => {
      if (err || !reply) reject(err || 'Not found')

      settings = JSON.parse(reply)
      resolve(JSON.parse(reply))
    })
  })
}

const updateSettings = async (key, value) => {
  settings[key] = value
  await client.set('settings', JSON.stringify(settings), redis.print)
}

module.exports = { getSettings, flushSettings, updateSettings }
