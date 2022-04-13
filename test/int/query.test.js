const {strict: assert, AssertionError} = require('assert')
const {describe, it, before, after} = require('mocha')
const pg = require('pg')
const mysql = require('mysql')
const {PgClient} = require('../../lib/pg/client')
const {MysqlClient} = require('../../lib/mysql/client')
const {promisify} = require('../../lib/util')

describe('SELECT statement', function() {
  const connection = {
    host: 'localhost',
    port: undefined,
    user: 'kvery_user',
    password: 'kvery_pass',
    database: 'kvery_db'
  }
  const pgOpts = {...connection, port: 25432} 
  const mysqlOpts = {...connection, port: 23306, user: 'root'}
  const clients = {
    pg: () => new PgClient({connection: pgOpts}),
    mysql: () => new MysqlClient({connection: mysqlOpts})
  }

  const util = (fn) => {
    const res = {}

    for (const [key, createClient] of Object.entries(clients)) {
      const builder = createClient().createBuilder()
      res[key] = fn(builder)
    }

    return res
  }

  before(async function() {
    const omitDb = ({database, ...rest}) => rest

    // pg
    {
      const pgClient = new pg.Client(omitDb(pgOpts))
      await pgClient.connect()
      await pgClient.query('DROP DATABASE IF EXISTS "kvery_db"')
      await pgClient.query('CREATE DATABASE "kvery_db"')
      pgClient.end()
    }

    //mysql
    {
      const mysqlConnection = mysql.createConnection(omitDb(mysqlOpts))
      const query = promisify(mysqlConnection.query).bind(mysqlConnection)
      await query('DROP DATABASE IF EXISTS `kvery_db`')
      await query('CREATE DATABASE `kvery_db`')
      mysqlConnection.end()
    }
  })

  it('Queries simple SELECT statement', function() {
    assert(true)
  })

  // after(function() {
  //   // TODO: delete db
  // })
})

