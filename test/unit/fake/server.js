const net = require('net')
const EventEmitter = require('events')
const {FakeConnection} = require('./connection')

// todo: consider just inherit Server
class FakeServer extends EventEmitter {
  constructor() {
    super()

    this._server = new net.Server(this._handleConnection.bind(this))
    this._connections = []
  }

  get listening() {
    return this._server.listening
  }

  listen(...args) {
    return this._server.listen(...args)
  }

  close(...args) {
    return this._server.close(...args)
  }

  _handleConnection(socket) {
    // console.log('[SERVER]: new socket on server')
    // socket.on('data', (data) => console.log(`[SERVER]: data: ${data}`))
    socket.on('data', () => {})
    socket.on('end', () => {
      // console.log('[SERVER]: on socket end')
      // socket.end(() => console.log('[SERVER]: socket end callback'))
    })
  }
}

module.exports = {
  FakeServer
}

