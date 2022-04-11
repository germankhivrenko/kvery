const {Pool} = require('./pool')

// todo: consider as factory/facade
class Client {
  constructor(options) {
    this._connectionOpts = options.connection
    this._pool = new Pool(this, options)
  }

  createBuilder() {
    throw new Error('Not implemented.')
  }

  createCompiler() {
    throw new Error('Not implemented.')
  }
  
  createConnection() {
    throw new Error('Not implemented.')
  }

  createExecutor() {
    throw new Error('Not implemented.')
  }

  query(q) {
    return this._pool.query(q)
  }
}

module.exports = {
  Client
}

