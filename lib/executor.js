class Executor {
  constructor(client, builder) {
    this._client = client
    this._builder = builder
  }

  exec() {
    const q = this._builder.toSQl()
    return this._client.query(q)
  }
}

module.exports = {
  Executor
}

