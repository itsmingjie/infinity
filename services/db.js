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
const { validateHash } = require('../lib/flagger')

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

// validate the login information
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

// get the user's latest data
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

// pull a list of puzzles that the user has solved
const getUserSolved = (id) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query(
          'SELECT id, action, uid, "puzzle" FROM logs WHERE (uid=$1 AND action=\'solve\')',
          [id]
        )
        .then((data) => {
          client.release()
          resolve(data.rows.map((m) => m.puzzle))
        })
        .catch((err) => {
          client.release()
          reject(err)
        })
    })
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

const listAllLogs = () => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query('SELECT * FROM logs')
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

const createAttempt = (uid, puzzle, attempt, value, success) => {
  return new Promise((resolve, reject) => {
    pool
      .connect()
      .then((client) => {
        client
          .query(
            'INSERT INTO logs (id, action, value, uid, puzzle, attempt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [
              uuidv4(),
              success ? 'solve' : 'attempt',
              value,
              uid,
              puzzle,
              attempt
            ]
          )
          .then((res) => {
            client.query('COMMIT')
            client.release()
            resolve(res.rows[0])
          })
          .catch((e) => reject(e))
      })
      .catch((e) => reject(e))
  })
}

const updateScore = (uid, value) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query('UPDATE teams SET score=(score+$1) WHERE id=$2', [value, uid])
        .then(() => {
          client.release()
          resolve()
        })
        .catch((err) => {
          client.release()
          reject(err)
        })
    })
  })
}

module.exports = {
  createUser,
  validateUser,
  getUser,
  listAllUsers,
  createAttempt,
  getUserSolved,
  updateScore,
  listAllLogs
}
