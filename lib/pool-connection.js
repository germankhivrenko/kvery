const {Connection} = require('./connection')

// todo: consider extending each adapter connection class/obj dynamically
class PoolConnection extends Connection {
  constructor(pool, connection) {
    super()

    this._pool = pool
    this._connection = connection

    this._connection.on('connect', (...args) => this.emit('connect', ...args))
    this._connection.on('close', (...args) => this.emit('close', ...args))
    this._connection.on('error', (...args) => this.emit('error', ...args))
  }

  get connected() {
    return this._connection.connected
  }

  get occupied() {
    return this._pool.occupied(this)
  }

  get closed() {
    return !this._connection.connected
  }

  connect(...args) {
    return this._connection.connect(...args)
  }

  ping(...args) {
    return this._connection.ping(...args)
  }

  query(...args) {
    if (!this.occupied) {
      throw new Error('Tried to query on released connection.')
    }

    return this._connection.query(...args)
  }

  end(...args) {
    return this._connection.end(...args)
  }

  release() {
    this._pool.release(this)
  }
}

const createPoolConnection = (pool, connection) => {
  if ('release' in connection) {
    throw new Error('Cannot extend connection. It already has "release" property.')
  }

  return Object.assign(connection, {
    release: function() {
      pool.release(this)
    }
  })
}

module.exports = {
  PoolConnection,
  createPoolConnection
}

