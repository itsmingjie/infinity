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
let settings

const getSettings = () => {
  return new Promise((resolve, reject) => {
    client.get('settings', (err, reply) => {
      if (err) {
        return reject(err)
      } else if (!reply) {
        return resolve({})
      }

      settings = JSON.parse(reply)
      resolve(settings)
    })
  })
}

const updateSettings = async (key, value) => {
  settings[key] = value
  await client.set('settings', JSON.stringify(settings), redis.print)
}

module.exports = { getSettings, updateSettings, client }
