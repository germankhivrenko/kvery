const {Builder} = require('../builder')

class PgBuilder extends Builder {
  constructor(client, table) {
    super(client, table)
  }
}

module.exports = {
  PgBuilder
}

