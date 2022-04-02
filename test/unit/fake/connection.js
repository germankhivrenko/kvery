const {Socket} = require('net')
const {Connection} = require('../../../lib/connection')
const {promisify} = require('../../../lib/util')

class FakeConnection extends Connection {
  constructor(options) {
    super()

    this._options = options
    this._socket = new Socket()
    this._socket.on('connect', () => {
      this.emit('connect')
    })
    // todo: investigate "close" and "end" difference
    this._socket.on('close', () => {
      this.emit('close')
    })
    this._socket.on('error', (err) => {
      this.emit('error', err)
    })

    this.connect = promisify(this._socket.connect).bind(this._socket, options)
  }

  get connected() {
    return !this._socket.pending
  }

  async ping() {
    if (this._socket.pending && !this._socket.connecting) {
      console.log('trying to connect in PING')
      await this.connect()
    }

    await promisify(this._socket.write).call(this._socket, '1')

    return Promise.resolve({res: 1})
  }

  async query(q) {
    if (this._socket.pending && !this._socket.connecting) {
      await this.connect()
    }

    await promisify(this._socket.write).call(this._socket, '1')

    return Promise.resolve(1)
  }

  end() {
    return new Promise((resolve, reject) => {
      this._socket.end()
      // set timer on end timeout
      const timer = setTimeout(() => {
        this._socket.destroy(new Error('End timeout occured.'))
      }, 1000)
      // close listener to clean up timer and throw an error if needed
      const listener = (hadError) => {
        clearTimeout(timer)
        this._socket.removeListener('close', listener)

        if (hadError) {
          reject(new Error('Error while closing socket occured.'))
        } else {
          resolve()
        }
      }
      this._socket.on('close', listener)
    })
  }
}

module.exports = {
  FakeConnection
}

