const {Client} = require('../client')
const {MysqlConnectionAdapter} = require('./connection')
const {MysqlBuilder} = require('./builder')
const {MysqlCompiler} = require('./compiler')
const {MysqlExecutor} = require('./executor')

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

  createConnection(options = {}) {
    const merged = Object.assign({}, options, this._connectionOpts)
    const mysqlConnection = this._driver.createConnection(merged)

    return new MysqlConnectionAdapter(mysqlConnection)
  }

  createExecutor(builder) {
    return new MysqlExecutor(this, builder)
  }
}

module.exports = {
  MysqlClient,
  Client: MysqlClient
}

