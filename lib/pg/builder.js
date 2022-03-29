const {Builder} = require('../builder')

class PgBuilder extends Builder {
  constructor(client) {
    super(client)
  }
}

module.exports = {
  PgBuilder
}

