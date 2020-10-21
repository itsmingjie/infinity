let io

const init = (http) => {
  io = require('socket.io')(http)
  return io
}

const interface = () => {
    if (!io) {
        throw new Error("IO has not been initialized! Run init() first.")
    }

    return io
}

const numUsersOnline = () => {
    return io.engine.clientsCount
}

module.exports = {init, interface, numUsersOnline}