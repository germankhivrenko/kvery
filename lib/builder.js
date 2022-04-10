const Op = {
  col: Symbol('col'),
  const: Symbol('const'),

  and: Symbol('and'),
  or: Symbol('or'),
  eq: Symbol('eq'),
  ne: Symbol('ne'),
  gt: Symbol('gt'),
  lt: Symbol('lt'),
  in: Symbol('in')
}
const OpArr = Object.values(Op)

class Builder {
  constructor(client, tableName = null) {
    this._client = client
    // this._statement = 'select'
    this._tableName = tableName
    this._columns = []
    this._values = [] // TODO: consider diff places for diff statements
    this._whereCondition = {}
    this._groupByColumns
    this._havingCondition = []
    this._orderByColumns = []
    this._limit = undefined
    this._offset = undefined
  }

  get statement() {return this._statement}
  get tableName() {return this._tableName}
  get columns() {return this._columns}
  get values() {return this._values}
  get whereCondition() {return this._whereCondition}
  get groupByColumns() {return this._groupByColumns}
  get havingCondition() {return this._havingCondition}
  get orderByColumns() {return this._orderByColumns}
  get limit() {return this._limit}
  get offset() {return this._offset}

  table(tableName) {
    this._tableName = tableName
    return this
  }

  into(table) {
    return this.table(table)
  }

  from(table) {
    return this.table(table)
  }

  insert(values) {
    this._statement = 'insert'

    const formatted = this._formatValues(values)
    this._values.push(...formatted)

    return this
  }

  select(...columns) {
    this._statement = 'select'

    const formatted = columns
      .flat()
      .map((col) => {
        if (typeof col === 'object') {
          return col
        }

        return {col}
      })

    this._columns.push(...formatted)

    return this
  }

  update(values) {
    this._statement = 'update'

    const formatted = this._formatValues(values)
    this._values.push(...formatted)

    return this
  }

  delete(tableName = null) {
    this._statement = 'delete'

    if (tableName) {
      this.table(tableName)
    }

    return this
  }

  where(condition) {
    const parsed = this._parseCondition(condition)
    // TODO: impl
    // this._whereCondition = this._mergeConditions(this._whereCondition, parsed)
    this._whereCondition = parsed

    return this
  }

  groupBy(columns) {
    this._groupByColumns.push(columns)
    return this
  }

  having(condition) {
    this._havingConditions.push(condition)
    return this
  }

  orderBy(columns, order = 'asc') {
    this._orderByColumns.push(columns)
    this._order = order
    return this
  }

  limit(value) {
    this._limit = value
    return this
  }

  offset(value) {
    this._offset = value
    return this
  }

  toSQL() {
    return this._client.createCompiler(this).toSQL()
  }

  _formatValues(values) {
    return Array.isArray(values)
      ? values
      : Object.entries(values).map(([col, val]) => ({col, val}))
  }

  // TODO: move condition parser logic to another class
  _parseCondition(condition) {
    // TODO: refac, especially naming
    // if array
    if (Array.isArray(condition)) {
      const res = []
      for (const c of condition) {
        res.push(this._parseCondition(c))
      }
      return res
    }
    
    // if node object
    const op = this._getOperator(condition)
    const leafNodes = Object.keys(condition)

    if (op && leafNodes.length) {
      throw new Error('Both operator and final condition are restricted.')
    }

    if (!op && !leafNodes.length) {
      throw new Error('Empty node.')
    }

    if (op) {
      return {
        op: op,
        operands: this._parseCondition(condition[op])
      }
    }

    const res = []
    for (const leafNodeKey of leafNodes) { // leafNodeKey is column name
      const leafCondition = condition[leafNodeKey]

      let op = Op.eq // default operator
      let value = leafCondition
      if (leafCondition instanceof Object) {
        const res = []
        if (Array.isArray(leafCondition)) {
        }

        op = this._getOperator(leafCondition)
        value = leafCondition[op]
      }

      // when on leaf condition
      res.push({
        op,
        data: null,
        operands: [
          {
            op: Op.col,
            data: leafNodeKey, // column name operand
            operands: null
          }, 
          {
            op: Op.const,
            data: value, // constant operand
            operands: null
          }
        ]
      })
    }

    if (res.length === 1) {
      return res[0]
    }

    return {
      op: Op.and,
      data: null,
      operands: res
    }
  }

  _getOperator(node) {
    const opNodes = Object.getOwnPropertySymbols(node)

    if (opNodes.length > 1) {
      throw new Error('Multiple operators in one node are restricted.')
    }

    if (!opNodes.length) {
      return null
    }

    const op = opNodes[0]

    if (!OpArr.includes(op)) {
      throw new Error(`Unexpected operator was met: ${op}.`)
    }

    return op
  }
}

module.exports = {
  Builder,
  Op
}

