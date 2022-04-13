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
    const {host, port, user, password, database} = Object({}, options, this._connectionOpts)
    const mysqlConnection = this._driver.createConnection({
      host,
      port,
      user,
      password,
      database
    })

    return new MysqlConnectionAdapter(mysqlConnection)
  }

  createExecutor(builder) {
    return MysqlExecutor(this, builder)
  }
}

module.exports = {
  MysqlClient,
  Client: MysqlClient
}

