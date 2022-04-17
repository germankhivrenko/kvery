class Executor {
  constructor(client, builder) {
    this._client = client
    this._builder = builder
  }

  exec() {
    const q = this._builder.toSQL()
    return this._client.exec(q)
  }
}

module.exports = {
  Executor
}

