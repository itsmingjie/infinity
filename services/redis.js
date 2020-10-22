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
let flushFlag = false

const getSettings = async () => {
  if (!flushFlag && settings) {
    reflag()
    return settings
  }
  else return await flushSettings()
}

const reflag = () => {
  client.get('flushFlag', (err, reply) => {
    flushFlag = (reply === true)
  })
}

const flushSettings = async () => {
  console.log("Flushing settings...")

  return new Promise((resolve, reject) => {
    client.get('settings', (err, reply) => {
      if (err) reject(err)
      else if (!reply) client.set('settings', JSON.stringify({}), redis.print)

      settings = JSON.parse(reply)
      flushFlag = false

      console.log("Settings flushed.")
      resolve(JSON.parse(reply))
    })
  })
}

const updateSettings = (key, value) => {
  settings[key] = value
  client.set('settings', JSON.stringify(settings), redis.print)

  flushFlag = true
  client.set('flushFlag', true)
}

module.exports = { getSettings, flushSettings, updateSettings, client }
