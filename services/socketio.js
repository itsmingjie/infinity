let io

const redis = require('redis')
const config = require('../config')
const redisAdapter = require('socket.io-redis')
const pub = redis.createClient(config.redis)
const sub = redis.createClient(config.redis)

const init = (http) => {
  io = require('socket.io')(http)
  io.adapter(redisAdapter({ pubClient: pub, subClient: sub }))

  return io
}

const interface = () => {
  if (!io) {
    throw new Error('IO has not been initialized! Run init() first.')
  }

  return io
}

const numUsersOnline = () => {
  return io.engine.clientsCount
}

module.exports = { init, interface, numUsersOnline }
