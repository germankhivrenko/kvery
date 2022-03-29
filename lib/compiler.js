const {Builder} = require('./builder')

class Compiler {
  constructor(builder) {
    if (!(builder instanceof Builder)) {
      throw TypeError('"builder" param is not instance of "Builder"')
    }

    this._builder = builder
  }

  toSQL() {
    const statement = this._builder.statement
    const handler = {
      insert: this._insert,
      select: this._select,
      update: this._update,
      delete: this._delete
    }[statement]

    if (!handler) {
      throw new Error(`Could not compile unknown statement: "${statement}"`)
    }

    return handler.call(this)
  }

  _insert() {
    const table = this._builder.table
    const values = Object.assign(this._builder.values)
    const colStr = values.map(([col]) => col).join(', ').trim()
    const valStr = values.map(([col, val]) => val).join(', ').trim()

    return `INSERT INTO ${table} (${colStr}) VALUES (${valStr})`
  }

  _select() {}

  _update() {}

  _delete() {}

  _condition(conditions) {
  }
}

module.exports = {
  Compiler
}

