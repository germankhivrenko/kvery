// TODO: test
//
// 1. constructor tests
//
// 1. seize() returns conn, ?instance of Connection/PoolConnection?
//  1.1. conn has connected state
// 2. seize() should throw if there is no free conns and timeout occured
// 3. seize() returns conn, after waiting in queue
//
// 1. cannot query()/ping() after release()
// 2. cannot release() twice
// 3. cannot release() conn not from the pool
// 3. can seize() after release(), when pool is full
//
// 1. close() releases, closes and removes all pool conns
// 2. close() works if some conns already closed
// 3. cannot seize() any after close()
//
// . should remove connections that have errors in the background

const {describe, it, before, after} = require('mocha') // to remove lsp warnings
const {strict: assert, AssertionError} = require('assert')
const {FakeServer} = require('./fake/server')
const {FakeClient} = require('./fake/client')
const {Pool} = require('../../lib/pool')
const {PoolConnection} = require('../../lib/pool-connection')

describe('Pool', function() {
  const options = {host: 'localhost', port: 4000}
  const server = new FakeServer()
  const client = new FakeClient({
    connection: options
  })

  before(function(done) {
    server.listen(options, done)
  })

  after(function(done) {
    server.close(done)
  })

  it('Throws when no client param is passed', function() {
    const fn = () => new Pool()

    assert.throws(fn, {
      name: 'TypeError',
      message: '"client" param must be instance of "Client".'
    })
  })

  it('Throws when client param is invalid', function() {
    const fn = () => new Pool({})

    assert.throws(fn, {
      name: 'TypeError',
      message: '"client" param must be instance of "Client".'
    })
  })

  it('Seizes connected PoolConnection instance from Pool', async function() {
    const pool = new Pool(client)
    const conn = await pool.seize()

    assert(conn instanceof PoolConnection)
    assert.equal(conn.connected, true)

    await pool.end() // FIXME: be able to disconnet
  })

  it('Throws if there is no available connections and seizeTimeout occured', async function() {
    const pool = new Pool(client, {
      maxSize: 1,
      seizeTime: 100
    })
    const conn1 = await pool.seize()
    
    try {
      const conn2 = await pool.seize()
      assert(false, 'Has to throw if seizeTimeout occured.')
    } catch(err) {
      if (err instanceof AssertionError) { // TODO: consider another way to test async throws
        assert(false, 'Has to throw when seizing after end.')
      }
      assert(err instanceof Error)
      assert.equal(err.message, 'Seize timeout occured.')
    } finally {
      await pool.end()
    }
  })

  it('Throws when seizing from closed pool', async function() {
    const pool = new Pool(client)
    assert.equal(pool.closed, false)

    await pool.end()
    assert.equal(pool.closed, true)

    try {
      const conn = await pool.seize()
      assert(false, 'Has to throw when seizing after end.')
    } catch(err) {
      if (err instanceof AssertionError) { // TODO: consider another way to test async throws
        assert(false, 'Has to throw when seizing after end.')
      }
      assert(err instanceof Error)
      assert.equal(err.message, 'Tried to seize from closed pool.')
    }
  })

  it('Trigger "connect" and "acquire" events correct number of times', async function() {
    let connectCount = 0
    let acquireCount = 0

    const pool = new Pool(client)
    pool.on('connect', () => connectCount++)
    pool.on('acquire', () => acquireCount++)

    const conn1 = await pool.seize()
    conn1.release()
    const conn2 = await pool.seize()

    assert.equal(conn1, conn2)
    assert.equal(connectCount, 1)
    assert.equal(acquireCount, 2)

    await pool.end()
  })
})

