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

  createConnection(options = {}) {
    const {host, port, user, password, database} = Object({}, options, this._connectionOpts)
    const pgConnection = new this._driver.Client({
      host,
      port,
      user,
      password,
      database
    })

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

