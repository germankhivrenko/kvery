const {Client} = require('../client')
const {PgBuilder} = require('./builder')
const {PgCompiler} = require('./compiler')
const {PgConnectionAdapter} = require('./connection')
const {PgExecutor} = require('./executor')

class PgClient extends Client {
  constructor(options) {
    super(options)

    this._driver = require('pg')
  }

  createBuilder() {
    return new PgBuilder(this)
  }

  createCompiler(builder) {
    return new PgCompiler(builder)
  }

  createConnection(options) {
    // todo: merge options
    const pgConnection = new this._driver.Client(this._connectionOpts)
    return new PgConnectionAdapter(pgConnection)
  }

  createExecutor(builder) {
    return PgExecutor(this, builder)
  }
}

module.exports = {
  PgClient,
  Client: PgClient
}

