/**
 * This is the primary service that drives the
 * connection between the verification server
 * and the database.
 */

const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid').v4

const config = require('../config')
const { reject } = require('lodash')

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
          .query('SELECT id, password FROM teams WHERE TRIM("name")=$1', [name])
          .then((res) => {
            if (res.rows[0] == null) {
              reject(new Error('Invalid Login'))
            } else {
              bcrypt.compare(password, res.rows[0].password, (err, cRes) => {
                client.release()
                if (err) {
                  return reject(new Error('Error'))
                }
                if (cRes) {
                  return resolve({
                    id: res.rows[0].id
                  })
                } else {
                  return reject(new Error('Invalid Login'))
                }
              })
            }
          })
          .catch((e) => reject(e))
      })
      .catch((e) => reject(e))
  })
}

const getUser = (id) => {
  return new Promise((resolve, reject) => {
    pool
      .connect()
      .then((client) => {
        client
          .query(
            'SELECT id, "name", "displayName", "admin", "score", "banned" FROM teams WHERE id=$1',
            [id]
          )
          .then((res) => {
            if (res.rows[0] == null) {
              reject(new Error('Invalid Login'))
            } else {
              resolve({
                id: res.rows[0].id,
                name: res.rows[0].name.trim(),
                displayName: res.rows[0].displayName
                  ? res.rows[0].displayName.trim()
                  : null,
                isAdmin: res.rows[0].admin,
                isBanned: res.rows[0].banned,
                score: res.rows[0].score
              })
            }
          })
          .catch((e) => reject(e))
          .finally(() => {
            client.release()
          })
      })
      .catch((e) => reject(e))
  })
}

const updateUser = (id, data) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client.query('UPDATE teams SET ')
    })
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

const listAllUsers = () => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query(
          'SELECT id, "name", "displayName", "affiliation", "admin", "score", "banned" FROM teams'
        )
        .then((data) => {
          client.release()
          resolve(data.rows)
        })
        .catch((err) => {
          client.release()
          reject(err)
        })
    })
  })
}

module.exports = { createUser, validateUser, getUser, listAllUsers }
