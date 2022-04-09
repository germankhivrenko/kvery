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
    const tableStr = this._delimitWrap(this._builder.tableName)
    const values = this._builder.values
    const colStr = values.map(({col}) => this._delimitWrap(col)).join(', ')
    const valStr = values.map(({val}) => this._mapValueToSQL(val)).join(', ')

    return `INSERT INTO ${tableStr} (${colStr}) VALUES (${valStr});`
  }

  _select() {
    const tableStr = this._delimitWrap(this._builder.tableName)
    const colStr = this._builder.columns
      .map(({col, as}) => {
        if (col === '*') {
          return '*'
        }

        if (as) {
          return `${this._delimitWrap(col)} AS ${this._delimitWrap(as)}`
        }

        return this._delimitWrap(col)
      })
      .join(', ')

    return `SELECT ${colStr} FROM ${tableStr};`
  }

  _update() {
    const tableName = this._builder.tableName
    const tableStr = this._delimitWrap(tableName)
    const values = this._builder.values
    const valuesStr = values
      .map(({col, val}) => {
        return `${this._delimitWrap(col)} = ${this._mapValueToSQL(val)}`
      })
      .join(', ')

    return `UPDATE ${tableStr} SET ${valuesStr};`
  }

  _delete() {
    const tableName = this._builder.tableName
    return `DELETE FROM ${this._delimitWrap(tableName)};`
  }

  _condition(conditions) {
  }

  _mapValueToSQL(value) {
    const type = typeof value

    return {
      'number': (value) => value,
      'string': (value) => `'${value}'`
    }[type](value)
  }

  _delimitWrap(wrapee) {
    throw new Error('Not implemented.')
  }
}

module.exports = {
  Compiler
}

