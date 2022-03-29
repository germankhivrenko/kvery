class Builder {
  constructor(client) {
    this._client = client
    // this._statement = 'select'
    // this._table = table
    this._columns = []
    this._values = {}
    this._whereCondition = []
    this._groupByColumns
    this._havingCondition = []
    this._orderByColumns = []
    this._limit = undefined
    this._offset = undefined
  }

  get columns() {return this._columns}
  get values() {return this._values}
  get whereCondition() {return this._whereCondition}
  get groupByColumns() {return this._groupByColumns}
  get havingCondition() {return this._havingCondition}
  get orderByColumns() {return this._orderByColumns}
  get limit() {return this._limit}
  get offset() {return this._offset}

  // [{col: 'columnName', val: 'value'}] or {col: 'value'}
  insert(values) {
    this._statement = 'insert'
    Object.assign(this._values, values)
    return this
  }

  // ['col1', 'col2']
  select(columns) {
    this._statement = 'select'
    this._columns.push(...columns)
    return this
  }

  update(values) {
    this._statement = 'update'
    Object.assign(this._values, values)
    return this
  }

  delete() {
    this._statement = 'delete'
    return this
  }

  from(table) {
    this._table = table
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
}

module.exports = {
  Builder
}

