const {Compiler} = require('../compiler')

class MysqlCompiler extends Compiler {
  constructor(builder, table) {
    super(builder, table)
  }

  _delimitWrap(wrapee) {
    return `\`${wrapee}\``
  }
}

module.exports = {
  MysqlCompiler
}

