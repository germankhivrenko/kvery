const EventEmitter = require('events')
const {Client} = require('./client')
const {PoolConnection} = require('./pool-connection')
const {identity} = require('./util')

const ALLOWED_POOL_OPTIONS = ['maxSize', 'seizeTimeout', 'connection']

class Pool extends EventEmitter {
  constructor(client, options) {
    super()

    this._validateCtorParams(client, options)

    const defaultOptions = {
      maxSize: 5,
      seizeTimeout: 1000
    }
    this._client = client

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

      return new Promise((resolve) => setTimeout(() => {
        this.emit('acquire')
        resolve(poolConnection)
      }, 0))
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
    const connection = await this._client.createConnection(this.options.connection)
    const poolConnection = new PoolConnection(this, connection)
    await poolConnection.connect()
    const newLength = this._pool.push(poolConnection)
    this._free[newLength - 1] = false
      
    this.emit('acquire')
    this.emit('connect')
    return poolConnection
  }

  release(poolConnection) {
    const index = this._pool.findIndex((pc) => pc === poolConnection)
    if (index === -1) {
      throw new Error('Tried to release connection not from the pool.')
    }

    if (this._queue.length) {
      // if someone's waiting for a connection
      const {timer, resolve} = this._queue.shift()
      clearTimeout(timer)

      this.emit('acquire')
      resolve(poolConnection)
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

    await Promise.all(this._pool.map((pc, index) => {
      this._free[index] = true

      if (!pc.closed) {
        return pc.end()
      }
      return Promise.resolve()
    }))
    this._closed = true
    this.emit('close')
  }

  async query(q) {
    if (this._closed) {
      throw new Error('Tried to query on closed pool.')
    }

    const conn = await this.seize()
    const res = conn.query(q)
    conn.release()
    return res;
  }

  occupied(poolConnection) {
    const index = this._pool.findIndex((pc) => pc === poolConnection)
    if (index === -1) {
      throw new Error('Tried to check connection no from the pool.')
    }

    return !this._free[index]
  }
  
  _validateCtorParams(client, options) {
    if (!(client instanceof Client)) {
      throw new TypeError('"client" param must be instance of "Client".')
    }

    this._validatePoolOptions(options)
  }

  // TODO: make it schema based validation
  _validatePoolOptions(options) {
    for (const key in options) {
      if (!ALLOWED_POOL_OPTIONS.includes(key)) {
        throw new TypeError(`Got unexpected option: "${key}".`)
      }
    }
  }
}

module.exports = {
  Pool
}

