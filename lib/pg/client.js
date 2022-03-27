const {Client} = require('../client')
const {PgConnectionAdapter} = require('./connection')

class PgClient extends Client {
  constructor(options) {
    super(options)

    this._driver = require('pg')
  }

  createBuilder() {
    // return new PgBuilder()
  }

  createConnection(options) {
    // todo: merge options
    const pgConnection = new this._driver.Client(this._connectionOpts)
    return new PgConnectionAdapter(pgConnection)
  }
}

module.exports = {
  PgClient,
  Client: PgClient
}

