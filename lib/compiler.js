const {Builder, Op} = require('./builder')

class Compiler {
  constructor(builder) {
    if (!(builder instanceof Builder)) {
      throw TypeError('"builder" param is not instance of "Builder"')
    }

    this._builder = builder
    this._compileCondition = this._compileCondition.bind(this) // fixes `this` problem for op compilers
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

    // TODO: common code to map values in "insert" and "update"
    const columns = values
      .flat()
      .map(({col}) => col)
      .filter((col, i, arr) => i === arr.indexOf(col))
    const colStr = columns
      .map(this._delimitWrap)
      .join(', ')
    const valStr = values
      .map((x) => {
        return columns
          .map((c) => x.find(({col}) => c === col) || {col: c, value: undefined})
          .map(({val}) => val === undefined ? 'DEFAULT' : this._mapValueToSQL(val))
          .join(', ')
      })
      .map((x) => `(${x})`)
      .join(', ')

    return `INSERT INTO ${tableStr} (${colStr}) VALUES ${valStr};`
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
    const whereClause = this._condition(this._builder.whereCondition)

    return `SELECT ${colStr} FROM ${tableStr}${whereClause};`
  }

  _update() {
    const tableName = this._builder.tableName
    const tableStr = this._delimitWrap(tableName)
    const values = this._builder.values[0] // FIXME: diff for "update" and "insert"
    const valuesStr = values
      .map(({col, val}) => {
        return `${this._delimitWrap(col)} = ${this._mapValueToSQL(val)}`
      })
      .join(', ')

    const whereClause = this._condition(this._builder.whereCondition)

    return `UPDATE ${tableStr} SET ${valuesStr}${whereClause};`
  }

  _delete() {
    const tableName = this._builder.tableName
    return `DELETE FROM ${this._delimitWrap(tableName)};`
  }

  _condition(condition) {
    if (!Object.getOwnPropertyNames(condition).length && !Object.getOwnPropertySymbols(condition).length) { // TODO: isEmpty util
      return ''
    }

    return ` WHERE ${this._compileCondition(condition)}`
  }

  _compileCondition(node) {
    const compiler = {
      [Op.col]: ({data}) => this._delimitWrap(data),
      [Op.const]: ({data}) => this._mapValueToSQL(data),

      [Op.and]: ({operands}) => {
        return '(' + operands.map(this._compileCondition).join(' AND ') + ')'
      },
      [Op.or]: ({operands}) => {
        return '(' + operands.map(this._compileCondition).join(' OR ') + ')'
      },
      [Op.eq]: ({operands}) => {
        if (operands.length !== 2) {
          throw new Error('Operator "eq" must take two operands.')
        }
        
        const [left, right] = operands
        const opStr = right.data === null ? 'IS' : '='
        return `${this._compileCondition(left)} ${opStr} ${this._compileCondition(right)}`
      },
      [Op.ne]: ({operands}) => {
        if (operands.length !== 2) {
          throw new Error('Operator "ne" must take two operands.')
        }
        
        const [left, right] = operands
        const opStr = right.data === null ? 'IS NOT' : '!='
        return `${this._compileCondition(left)} ${opStr} ${this._compileCondition(right)}`
      },
      [Op.gt]: ({operands}) => {
        if (operands.length !== 2) {
          throw new Error('Operator "gt" must take two operands.')
        }
        
        const [left, right] = operands
        return `${this._compileCondition(left)} > ${this._compileCondition(right)}`
      },
      [Op.lt]: ({operands}) => {
        if (operands.length !== 2) {
          throw new Error('Operator "lt" must take two operands.')
        }
        
        const [left, right] = operands
        return `${this._compileCondition(left)} < ${this._compileCondition(right)}`
      },
      [Op.in]: ({operands}) => {
        const [left, right] = operands
        const valuesStr = this._compileCondition(right).join(', ')

        return `${this._compileCondition(left)} IN (${valuesStr})`
      },
    }[node.op]

    if (!compiler) {
      throw new Error(`Not found compiler for operator: ${node.op}.`)
    }

    return compiler(node)
  }

  _mapValueToSQL(value) {
    if (value === null) {
      return 'NULL'
    }

    if (Array.isArray(value)) {
      return value.map(this._mapValueToSQL)
    }

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

