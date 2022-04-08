const {Compiler} = require('../compiler')

class PgCompiler extends Compiler {
  constructor(builder, table) {
    super(builder, table)
  }

  _delimitWrap(wrapee) {
    return `"${wrapee}"`
  }
}

module.exports = {
  PgCompiler
}

