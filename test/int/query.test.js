const fs = require('fs')
const util = require('util')
const {strict: assert, AssertionError} = require('assert')
const exec = util.promisify(require('child_process').exec)
const {describe, it, before, after} = require('mocha')
const pg = require('pg')
const mysql = require('mysql')
const {PgClient} = require('../../lib/pg/client')
const {MysqlClient} = require('../../lib/mysql/client')
const {promisify} = require('../../lib/util')

describe('INSERT/SELECT/UPDATE/DELETE statements', function() {
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

  const util = async (fn) => {
    const res = {}


    for (const [key, createClient] of Object.entries(clients)) {
      const client = createClient()
      res[key] = await Promise.resolve(fn(client))
    }

    return res
  }

  beforeEach(async function() {
    const omitDb = ({database, ...rest}) => rest

    // pg
    {
     const pgClient = new pg.Client({...pgOpts, database: 'kvery_db_template'})
      await pgClient.connect()
      await pgClient.query('DROP DATABASE IF EXISTS "kvery_db"')
      await pgClient.query('CREATE DATABASE "kvery_db" TEMPLATE "kvery_db_template"')
      pgClient.end()
    }

    //mysql
    {
      {
        const mysqlConnection = mysql.createConnection(omitDb(mysqlOpts))
        const query = promisify(mysqlConnection.query).bind(mysqlConnection)
        await query('DROP DATABASE IF EXISTS `kvery_db`')
        await query('CREATE DATABASE `kvery_db`')
        mysqlConnection.end()
      }

      {
        const mysqlConnection = mysql.createConnection({...mysqlOpts, multipleStatements: true})
        const query = promisify(mysqlConnection.query).bind(mysqlConnection)
        const q = fs.readFileSync('./test/dump/kvery_db.mysql').toString()
        await query(q)
        mysqlConnection.end()
      }
    }
  })

  // INSERT
  it('Insert single value', async function() {
    await util(async (client) => {
      await client
        .query()
        .insert({name: 'New Test Item'})
        .into('items')
        .exec()

      const actual = await client.exec(`SELECT * FROM items WHERE name = 'New Test Item'`)
      const expected = [{id: 3, name: 'New Test Item', rate: 0, description: null}]

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  it('Insert multiple values', async function() {
    await util(async (client) => {
      await client
        .query()
        .insert([{name: 'New Test Item'}, {name: 'Another Test Item', rate: 10}])
        .into('items')
        .exec()

      const actual = await client.exec(`SELECT * FROM items WHERE name IN ('New Test Item', 'Another Test Item')`)
      const expected = [
        {id: 3, name: 'New Test Item', rate: 0, description: null},
        {id: 4, name: 'Another Test Item', rate: 10, description: null}
      ]

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  // SELECT
  it('Selects all items', async function() {
    await util(async (client) => {
      const actual = await client
        .query()
        .select('*')
        .from('items')
        .exec()
      const expected = [
        {id: 1, name: 'Test Item 1', rate: 5, description: 'Lorem ipsum'},
        {id: 2, name: 'Test Item 2', rate: 0, description: null}
      ]

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  it('Selects only the specified columns from all items', async function() {
    await util(async (client) => {
      const actual = await client
        .query()
        .select('id', 'name')
        .from('items')
        .exec()
      const expected = [
        {id: 1, name: 'Test Item 1'},
        {id: 2, name: 'Test Item 2'}
      ]

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  it('Selects item ids by id', async function() {
    await util(async (client) => {
      const actual = await client
        .query()
        .select('id', 'name')
        .from('items')
        .where({id: 1})
        .exec()
      const expected = [{id: 1, name: 'Test Item 1'}]

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  // UPDATE
  it('Updates specified item', async function() {
    await util(async (client) => {
      await client
        .query()
        .update({name: 'Updated Item', rate: 10})
        .table('items')
        .where({id: 1})
        .exec()
      const actual = await client.exec('SELECT * FROM items WHERE id = 1')
      const expected = [{id: 1, name: 'Updated Item', rate: 10, description: 'Lorem ipsum'}]

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  // DELETE
  it('Deletes specified item', async function() {
    await util(async (client) => {
      await client
        .query()
        .delete()
        .from('items')
        .where({id: 1})
        .exec()
      const actual = await client.exec('SELECT * FROM items WHERE id = 1')
      const expected = []

      assert.deepEqual(actual, expected)

      await client.end()
    })
  })

  // TODO: WHERE clause
})

