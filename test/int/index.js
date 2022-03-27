const {createInstance} = require('../../lib')

// MySQL connection =====
;(async function() {
  const instance = createInstance({
    driver: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'kvery_test'
    }
  })
  
  const conn = instance.connection()

  conn.connect()
  const pingRes = await conn.ping()
  const res1 = await conn.query('select 1')
  const res2 = await conn.query('select 2')
  await conn.close()

  // console.dir(pingRes)
  // console.dir(res1)
  // console.dir(res2)
})()

// Postgres connection =====
;(async function() {
  const instance = createInstance({
    driver: 'pg',
    connection: {
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      database: 'kvery_test'
    }
  })

  const conn = instance.connection()
  
  conn.connect()
  const pingRes = await conn.ping()
  const res1 = await conn.query('select 1')
  const res2 = await conn.query('select 2')
  await conn.close()

  // console.dir(pingRes)
  // console.dir(res1)
  // console.dir(res2)
})()

