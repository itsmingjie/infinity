/**
 * This is the primary service that drives the
 * connection between the verification server
 * and the database.
 */

const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid').v4

const config = require('../config')

const pool = new Pool({
  connectionString: config.db
})

const createUser = (name, password) => {
  return new Promise((resolve, reject) => {
    hashPassword(password).then((passHash) => {
      pool
        .connect()
        .then((client) => {
          return client
            .query('SELECT id FROM "teams" WHERE "name"=$1', [name])
            .then((res) => {
              if (res.rows[0]) {
                reject(new Error('Duplicated team login'))
              } else {
                client
                  .query(
                    'INSERT INTO teams (id, name, password) VALUES ($1, $2, $3)',
                    [uuidv4(), name, passHash]
                  )
                  .then((res) => {
                    client.query('COMMIT')
                    client.release()
                    resolve()
                  })
                  .catch((e) => reject(e))
              }
            })
            .catch((e) => reject(e))
        })
        .catch((e) => reject(e))
    })
  })
}

const validateUser = (name, password) => {
  return new Promise((resolve, reject) => {
    pool
      .connect()
      .then((client) => {
        client
          .query(
            'SELECT id, "name", "displayName", "password", "admin" FROM teams WHERE TRIM("name")=$1',
            [name]
          )
          .then((res) => {
            if (res.rows[0] == null) {
              reject(new Error('Invalid Login'))
            } else {
              bcrypt
                .compare(password, res.rows[0].password)
                .then((check) => {
                  resolve({
                    name: res.rows[0].name.trim(),
                    displayName: res.rows[0].displayName.trim(),
                    isAdmin: res.rows[0].admin
                  })
                })
                .catch((e) => reject(new Error('Invalid Login')))
            }
          })
          .catch((e) => reject(e))
      })
      .catch((e) => reject(e))
  })
}

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 5, (err, hash) => {
      if (err) reject(err)
      else resolve(hash)
    })
  })
}

module.exports = { createUser, validateUser }
