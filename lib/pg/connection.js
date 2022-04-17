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

  get connected() {
    return this._rawConnection._connected
  }

  async connect() {
    await this._rawConnection.connect()
  }

  ping() {
    return this.query('select 1')
  }

  async query(...args) {
    await this._safeConnect()
    // TODO: more comprehensive parsing of result
    const {rows} = await this._rawConnection.query(...args)
    return rows;
  }

  end() {
    return this._rawConnection.end()
  }

  _safeConnect() {
    // todo: research another way to connect safely
    if (!this.connected && !this._rawConnection._connecting) {
      return this._rawConnection.connect()
    }
  }
}

module.exports = {
  PgConnectionAdapter
}

