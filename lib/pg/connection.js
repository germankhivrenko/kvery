const {Connection} = require('../connection')

class PgConnectionAdapter extends Connection {
  constructor(rawConnection) {
    super()

    this._rawConnection = rawConnection

    // events
    rawConnection.on('error', (err) => {
      this.emit('error', err)
    })
    // todo: add connect and close events
  }

  connect() {
    return this._rawConnection.connect()
  }

  ping() {
    return this.query('select 1')
  }

  async query(...args) {
    await this._safeConnect()
    return this._rawConnection.query(...args)
  }

  end() {
    return this._rawConnection.end()
  }

  _safeConnect() {
    // todo: research another way to connect safely
    if (!this._rawConnection._connected && !this._rawConnection._connecting) {
      return this._rawConnection.connect()
    }
  }
}

module.exports = {
  PgConnectionAdapter
}

