class Builder {
  constructor(client, tableName = null) {
    this._client = client
    // this._statement = 'select'
    this._tableName = tableName
    this._columns = []
    this._values = [] // TODO: consider diff places for diff statements
    this._whereCondition = []
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
    this._whereConditions.push(condition)
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
}

module.exports = {
  Builder
}

