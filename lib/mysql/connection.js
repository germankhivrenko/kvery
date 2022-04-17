const {Connection} = require('../connection')
const {promisify} = require('../util')

class MysqlConnectionAdapter extends Connection {
  constructor(rawConnection) {
    super()
    
    this._rawConnection = rawConnection

    this.connect = promisify(rawConnection.connect).bind(rawConnection)
    this.ping = promisify(rawConnection.ping).bind(rawConnection)
    this.promiseQuery = promisify(rawConnection.query).bind(rawConnection)
    this.promiseEnd = promisify(rawConnection.end).bind(rawConnection)

    // events
    rawConnection.on('error', (err) => {
      this.emit('error', err)
    })
    // todo: connect and close events
  }

  get connected() {
    return this._rawConnection.state === 'authenticated'
  }

  async query(q) {
    // TODO: parse result
    const res = await this.promiseQuery(q)

    if (Array.isArray(res)) {
      const arrRes = []
      for (let i = 0; i < res.length; i++) {
        arrRes.push({...res[i]})
      }
      return arrRes
    }

    return res
  }

  end() {
    return this.promiseEnd()
  }
}

module.exports = {
  MysqlConnectionAdapter
}

