const EventEmitter = require('events')

// TODO: should have connect, end (should have error), error events
// TODO: create both impls for all the methods (callback and promised based)
// TODO: define connection states 
// ('connected', 'disconnected', 'connecting', 'disconnecting')
class Connection extends EventEmitter {
  constructor() {
    super()
  }

  get connected() {
    throw new Error('Not implemented.')
  }

  connect() {
    throw new Error('Not implemented.')
  }

  ping() {
    throw new Error('Not implemented.')
  }

  query() {
    throw new Error('Not implemented.')
  }

  end() {
    throw new Error('Not implemented.')
  }
}

module.exports = {
  Connection
}

