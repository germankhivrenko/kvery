const {Builder} = require('../builder')

class MysqlBuilder extends Builder {
  constructor(client, table) {
    super(client, table)
  }
}

module.exports = {
  MysqlBuilder
}

