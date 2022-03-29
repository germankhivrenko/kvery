// todo: consider as factory/facade
class Client {
  constructor(options) {
    this._connectionOpts = options.connection
  }

  createBuilder() {
    throw new Error('Not implemented.')
  }

  createCompiler() {
    throw new Error('Not implemented.')
  }
  
  createConnection() {
    throw new Error('Not implemented.')
  }
}

module.exports = {
  Client
}

