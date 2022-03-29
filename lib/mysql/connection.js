const {Connection} = require('../connection')
const {promisify} = require('../util')

class MysqlConnectionAdapter extends Connection {
  constructor(rawConnection) {
    super()

    this.connect = promisify(rawConnection.connect).bind(rawConnection)
    this.ping = promisify(rawConnection.ping).bind(rawConnection)
    this.query = promisify(rawConnection.query).bind(rawConnection)
    this.end = promisify(rawConnection.end).bind(rawConnection)

    // events
    rawConnection.on('error', (err) => {
      this.emit('error', err)
    })
    // todo: connect and close events
  }
}

module.exports = {
  MysqlConnectionAdapter
}

