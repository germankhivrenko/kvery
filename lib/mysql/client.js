const {Client} = require('../client')
const {MysqlConnectionAdapter} = require('./connection')
const {MysqlBuilder} = require('./builder')
const {MysqlCompiler} = require('./compiler')

class MysqlClient extends Client {
  constructor(options) {
    super(options)

    this._driver = require('mysql')
  }

  createBuilder() {
     return new MysqlBuilder(this)
  }

  createCompiler(builder) {
    return new MysqlCompiler(builder)
  }

  createConnection() {
    // pass and merge options
    const mysqlConnection = this._driver.createConnection(this._connectionOpts)
    return new MysqlConnectionAdapter(mysqlConnection)
  }
}

module.exports = {
  MysqlClient,
  Client: MysqlClient
}

