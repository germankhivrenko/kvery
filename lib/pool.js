const EventEmitter = require('events')
const {Client} = require('./client')
const {PoolConnection} = require('./pool-connection')
const {identity} = require('./utils')

class Pool extends EventEmitter {
  constructor(client, options) {
    super()

    if (!(client instanceof Client)) {
      throw new TypeError('"client" param must be instance of "Client".')
    }

    const defaultConfig = {
      maxSize: 10,
      seizeTimeout: 1000
      // todo: add more options
    }
    this._client = client
    this._options = Object.assign(defaultConfig, options)

    this._pool = []
    this._free = []
    this._queue = []

    this._closed = false
  }

  get closed() {
    return this._closed
  }

  async seize() {
    if (this._closed) {
      throw new Error('Tried to seize from closed pool.')
    }

    const index = this._free.findIndex(identity)
    if (index !== -1) {
      // if has a free connection
      this._free[index] = false
      const poolConnection = this._pool[index]

      this.emit('acquire')
      return poolConnection
    }

    if (this._pool.length === this._options.maxSize) {
      // if pool already has max size of connections
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Seize timeout occured.'))
        }, this._options.seizeTimeout)

        this._queue.push({timer, resolve})
      })
    }

    // if pool is not full, creates a new connection
    const connection = await this._client.createConnection()
    const poolConnection = new PoolConnection(this, connection)
    await poolConnection.connect()
    const newLength = this._pool.push(poolConnection)
    this._free[newLength - 1] = false
      
    this.emit('acquire')
    this.emit('connect')
    return poolConnection
  }

  release(connection) {
    const index = this._pool.findIndex((c) => c === connection)
    if (index === -1) {
      throw new Error('Failed to release connection not from the pool.')
    }

    if (this._queue.length) {
      // if someone's waiting for a connection
      const {timer, resolve} = this._queue.shift()
      clearTimeout(timer)

      this.emit('acquire')
      resolve(connection)
    } else {
      this._free[index] = true
    }
 }

  async end() {
    for (const index in this._free) {
      const isFree = this._free[index]
      if (isFree) {
        this.release(this._pool[index])
      }
    }

    // try {
    //   await Promise.all(this._pool.map((c) => c.end()))
    //   this.emit('close')
    // } catch(err) {
    //   this.emit('close', err)
    //   throw err
    // }
      
    await Promise.all(this._pool.map((c) => c.end()))
    this._closed = true
    this.emit('close')
  }

  async query(q) {
    const conn = await this.seize()
    const res = conn.query(q)
    conn.release()
    return res;
  }
}

module.exports = {
  Pool
}

