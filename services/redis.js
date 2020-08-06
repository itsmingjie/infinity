const redis = require('redis')
const config = require('../config')

const client = redis.createClient(config.redis)

client.on('error', (error) => {
  console.error(error)
})

client.on('connect', () => {
  console.log(`The Redis instance at ${client.address} has been connected.`)
})

let settings

const getSettings = async () => {
  settings = await client.get('settings')
}

module.exports = { settings }
