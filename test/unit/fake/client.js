const {Client} = require('../../../lib/client')
const {FakeConnection} = require('./connection')

class FakeClient extends Client {
  constructor(options) {
    super(options)
  }

  createConnection() {
    return new FakeConnection(this._connectionOpts)
  }
}

module.exports = {
  FakeClient
} 

