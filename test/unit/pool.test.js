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

  it('Throws when unexpected options is passed', function() {
    const fn = () => new Pool(client, {
      unexpectedName: 'whatever'
    })

    assert.throws(fn, {
      name: 'TypeError',
      message: 'Got unexpected option: "unexpectedName".'
    })
  })

  it('Throws when unexpected options is passed (has to check nested)', function() {
    const fn = () => new Pool(client, {
      connection: {
        unexpectedName: 'whatever'
      }
    })

    assert.throws(fn, {
      name: 'TypeError',
      message: 'Got unexpected option: "connection.unexpectedName".'
    })
  })

  it('Seizes connected PoolConnection instance from Pool', async function() {
    const pool = new Pool(client)
    const conn = await pool.seize()

    assert(conn instanceof PoolConnection)
    assert.equal(conn.connected, true)

    await pool.end() // FIXME: be able to disconnet
  })

  it('Seize always has async behavior', async function() {
    const pool = new Pool(client, {
      maxSize: 1,
      seizeTimeout: 100
    })
    let count = 0

    setImmediate(() => count++)
    // creates new connection
    const conn1 = await pool.seize()
    assert.equal(count, 1)

    conn1.release()

    setImmediate(() => count++)
    // seizes existing connection
    const conn2 = await pool.seize()
    assert.equal(count, 2)

    await pool.end()
  })

  it('Seizes connection if there is no available connections when one is released', async () => {
    const pool = new Pool(client, {
      maxSize: 1,
      seizeTimeout: 100
    })
    const conn1 = await pool.seize()
    setTimeout(() => conn1.release(), 100) 
    const conn2 = await pool.seize()
    assert(conn2)

    await pool.end()
  })

  it('Throws if there is no available connections and seizeTimeout occured', async function() {
    const pool = new Pool(client, {
      maxSize: 1,
      seizeTimeout: 100
    })
    const conn1 = await pool.seize()
    setTimeout(() => conn1.release(), 200) 
    
    try {
      const conn2 = await pool.seize()
      console.dir(conn2)
      assert(false, 'Has to throw if seizeTimeout occured.')
    } catch(err) {
      if (!(err instanceof AssertionError)) {
        assert(err instanceof Error)
        assert.equal(err.message, 'Seize timeout occured.')
      } else {
        throw err
      }
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
      if (!(err instanceof AssertionError)) {
        assert(err instanceof Error)
        assert.equal(err.message, 'Tried to seize from closed pool.')
      } else {
        throw err
      }
    }
  })

  it('Run query on pool', async function() {
    const pool = new Pool(client)
    const res = await pool.query('SELECT 1')

    assert.equal(res, 1) // TODO: define query result type

    await pool.end()
  })

  it('Throws when query on closed pool', async function() {
    const pool = new Pool(client)
    await pool.end()

    assert.equal(pool.closed, true)

    try {
      const res = await pool.query()
      assert(false, 'Has to throw when query on closed pool.')
    } catch(err) {
      if (!(err instanceof AssertionError)) {
        assert(err instanceof Error)
        assert.equal(err.message, 'Tried to query on closed pool.')
      } else {
        throw err
      }
    }
  })

  it('Throws when ping on released connection', async function() {
    const pool = new Pool(client)
    const conn = await pool.seize()
    conn.release()

    assert.equal(conn.occupied, false)

    try {
      const res = await conn.ping()
      assert(false, 'Has to throw when ping on released connection.')
    } catch(err) {
      if (!(err instanceof AssertionError)) {
        assert(err instanceof Error)
        assert.equal(err.message, 'Tried to ping on released connection.')
      } else {
        throw err
      }
    } finally {
      await pool.end()
    }
  })
  
  it('Throws when query on released connection', async function() {
    const pool = new Pool(client)
    const conn = await pool.seize()
    conn.release()

    assert.equal(conn.occupied, false)

    try {
      const res = await conn.query()
      assert(false, 'Has to throw when query on released connection.')
    } catch(err) {
      if (!(err instanceof AssertionError)) {
        assert(err instanceof Error)
        assert.equal(err.message, 'Tried to query on released connection.')
      } else {
        throw err
      }
    } finally {
      await pool.end()
    }
  })

  it('Throws when release connetion not from the pool', async function() {
    const pool1 = new Pool()
    const pool2 = new Pool()
    const conn = await pool1.seize()

    try {
      pool2.release(conn)
      assert(false, 'Has to throw when release connection no not from the pool.')
    } catch(err) {
      if (!(err instanceof AssertionError)) {
        assert(err instanceof Error)
        assert.equal(err.message, 'Tried to release connection not from the pool.')
      } else {
        throw err
      }
    } finally {
      await pool1.end()
      await pool2.end()
    }
  })

  it('Releases and closes all connections', async function() {
    const pool = await new Pool()
    const conn1 = await pool.seize()
    const conn2 = await pool.seize()

    await pool.end()

    assert.equal(pool.closed, true)

    assert.equal(conn1.occupied, false)
    assert.equal(conn1.closed, true)

    assert.equal(conn2.occupied, false)
    assert.equal(conn2.closed, true)
  })

  it('Releases and closes the rest of connections if some of them already closed', async function() {
    const pool = await new Pool()
    const conn1 = await pool.seize()
    const conn2 = await pool.seize()

    await conn1.end()

    assert.equal(conn1.closed, true)

    await pool.end()

    assert.equal(pool.closed, true)

    assert.equal(conn1.occupied, false)
    assert.equal(conn1.closed, true)

    assert.equal(conn2.occupied, false)
    assert.equal(conn2.closed, true)
  })

  // ============================ EVENTS ============================
  // TODO: should remove connections that have errors in the background
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

