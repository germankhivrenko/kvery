const createInstance = (options = {}) => {
  if (!options.driver) {
    throw new Error('Missing driver.')
  }

  const {Client} = require(`./${options.driver}/client`)
  const clientConfig = {
    connection: options.connection,
    pool: options.pool
  }
  return new Client(clientConfig)
}

module.exports = {
  createInstance
}

