const {strict: assert, AssertionError} = require('assert')
const {describe, it, before, after} = require('mocha')
const {PgClient} = require('../../pg/client')
const {MysqlClient} = require('../../mysql/client')

describe('Builder', function() {
  // TODO: test apart from Client and Compiler
  // TODO: only text for setup
  const clients = {
    pg: new PgClient(),
    mysql: new MysqlClient()
  }

  // TODO: rearrange to be: 1 test = 1 client builder run (now 1 test = all clients run)
  const util = (fn) => {
    const res = {}

    for (const [key, client] of Object.entries(clients)) {
      const builder = client.createBuilder()
      res[key] = fn(builder)
    }

    return res
  }

  // INSERT ==================================================================
  it('Creates single record INSERT statement (implicit insert value)', function() {
    const actual = util((builder) => builder
      .insert({name: 'Test Item', rate: 5})
      .into('items')
      .toSQL())
    const expected = {
      pg: `INSERT INTO "items" ("name", "rate") VALUES ('Test Item', 5);`,
      mysql: 'INSERT INTO `items` (`name`, `rate`) VALUES (\'Test Item\', 5);'
    }

    assert.deepEqual(actual, expected)
  })

  it('Creates single record INSERT statement (explicit form of insert value)', function() {
    const actual = util((builder) => builder
      .insert([{col: 'name', val: 'Test Item'}, {col: 'rate', val: 5}])
      .into('items')
      .toSQL())
    const expected = {
      pg: `INSERT INTO "items" ("name", "rate") VALUES ('Test Item', 5);`,
      mysql: 'INSERT INTO `items` (`name`, `rate`) VALUES (\'Test Item\', 5);'
    }

    assert.deepEqual(actual, expected)
  })

  // SELECT ==================================================================
  it('Creates SELECT statement', function() {
    const actual = util((builder) => builder.select('*').from('items').toSQL())
    const expected = {
      pg: 'SELECT * FROM "items";',
      mysql: 'SELECT * FROM `items`;'
    }

    assert.deepEqual(actual, expected)
  })

  it('Creates SELECT statement according to columns set', function() {
    const actual = util((builder) => builder
      .select('id', 'name') // TODO: support args to be array
      .from('items')
      .toSQL())
    const expected = {
      pg: 'SELECT "id", "name" FROM "items";',
      mysql: 'SELECT `id`, `name` FROM `items`;'
    }

    assert.deepEqual(actual, expected)
  })

  it('Creates SELECT statement according to column aliases set', function() {
    const actual = util((builder) => builder
      .select({col: 'id', as: 'myId'}, {col: 'name', as: 'myName'})
      .from('items')
      .toSQL())
    const expected = {
      pg: 'SELECT "id" AS "myId", "name" AS "myName" FROM "items";',
      mysql: 'SELECT `id` AS `myId`, `name` AS `myName` FROM `items`;'
    }

    assert.deepEqual(actual, expected)
  })

  // UPDATE ==================================================================
  it('Creates UPDATE statement', function() {
    const actual = util((builder) => builder
      .table('items')
      .update({name: 'Updated Test Item', rate: 10})
      .toSQL())
    const expected = {
      pg: `UPDATE "items" SET "name" = 'Updated Test Item', "rate" = 10;`,
      mysql: 'UPDATE `items` SET `name` = \'Updated Test Item\', `rate` = 10;'
    }

    assert.deepEqual(actual, expected)
  })

  // DELETE ==================================================================
  it('Creates DELETE statement', function() {
    const actual = util((builder) => builder.delete('items').toSQL())
    const expected = {
      pg: 'DELETE FROM "items";',
      mysql: 'DELETE FROM `items`;'
    }

    assert.deepEqual(actual, expected)
  })
})

