const {Compiler} = require('../compiler')

class PgCompiler extends Compiler {
  constructor(builder) {
    super(builder)
  }
}

module.exports = {
  PgCompiler
}

