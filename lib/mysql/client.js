const {Client} = require('../client')
const {MysqlConnectionAdapter} = require('./connection')

class MysqlClient extends Client {
  constructor(options) {
    super(options)

    this._driver = require('mysql')
  }

  createBuilder() {
    // return new MysqlBuilder()
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

