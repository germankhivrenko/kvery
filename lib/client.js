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

  query(tableName) {
    return this.createBuilder(this, tableName)
  }

  exec(q) {
    return this._pool.query(q)
  }

  async end() {
    await this._pool.end()
  }
}

module.exports = {
  Client
}

