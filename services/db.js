/**
 * This is the primary service that drives the
 * connection between the verification server
 * and the database.
 */

const { Pool } = require('pg')
const format = require('pg-format')
const bcrypt = require('bcrypt')
const uuidv4 = require('uuid').v4

const config = require('../config')

const pool = new Pool({
  connectionString: config.db,
  ssl: { rejectUnauthorized: false }
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

const logSignin = (uid, ip) => {
  pool
    .connect()
    .then((client) => {
      client
        .query(
          'INSERT INTO logs (id, uid, action, detail) VALUES ($1, $2, $3, $4)',
          [uuidv4(), uid, 'login', ip]
        )
        .then(() => {
          client.query('COMMIT')
          client.release()
        })
    })
    .catch((e) => reject(e))
}

// get the user's latest data
const getUser = (id) => {
  return new Promise((resolve, reject) => {
    pool
      .connect()
      .then((client) => {
        client
          .query(
            'SELECT id, name, display_name, admin, affiliation, division, score, emails, banned, hint_credit FROM teams WHERE id=$1',
            [id]
          )
          .then((res) => {
            if (res.rows[0] == null) {
              reject(new Error('Invalid Login'))
            } else {
              resolve({
                id: res.rows[0].id,
                name: res.rows[0].name.trim(),
                display_name: res.rows[0].display_name
                  ? res.rows[0].display_name.trim()
                  : null,
                affiliation: res.rows[0].affiliation,
                division: res.rows[0].division,
                isAdmin: res.rows[0].admin,
                isBanned: res.rows[0].banned,
                emails: res.rows[0].emails,
                score: res.rows[0].score,
                hint_credit: res.rows[0].hint_credit
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

// Update individual user's data by key
const updateUser = (id, key, data) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      const q = format('UPDATE teams SET %I = %L WHERE id = %L', key, data, id)
      client
        .query(q)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
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
          'SELECT id, "name", "display_name", "affiliation", "admin", "score", "banned" FROM teams'
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

const listUserByDivisions = (division) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query(
          'SELECT id, display_name, affiliation, score, division FROM teams WHERE division=$1 ORDER BY score DESC',
          [division]
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

// returns a dictionary that maps UUIDs to account names
const listUserIds = () => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query('SELECT id, "name" FROM teams')
        .then((data) => {
          resolve(
            data.rows.reduce((acc, team) => {
              acc[team.id] = team.name
              return acc
            }, {})
          )
          client.release()
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
            'INSERT INTO logs (id, action, value, uid, puzzle, detail) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
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

const getHintCredit = (uid) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query('SELECT hint_credit FROM teams WHERE id=$1', [uid])
        .then((data) => {
          client.release()
          resolve(data.rows[0]['hint_credit'])
        })
        .catch((err) => {
          client.release()
          reject(err)
        })
    })
  })
}

const createHintIntent = (uid, puzzle, hint, deduction) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      // create hint request
      client.query(
        'INSERT INTO logs (id, action, value, uid, puzzle, detail) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [uuidv4(), 'hint', 0 - deduction, uid, puzzle, `${hint}`]
      )

      // deduct user's hint credit
      client.query('UPDATE teams SET hint_credit=(hint_credit-1) WHERE id=$1', [
        uid
      ])

      client.on('error', (err) => {
        reject(err)
      })

      client.query('COMMIT').then((res) => {
        client.release()
        resolve()
      })
    })
  })
}

const getUnlockedHints = (uid, puzzle) => {
  return new Promise((resolve, reject) => {
    pool.connect().then((client) => {
      client
        .query(
          "SELECT id, puzzle, action, uid, detail FROM logs WHERE (uid=$1 AND puzzle=$2 AND action='hint')",
          [uid, puzzle]
        )
        .then((data) => {
          client.release()
          resolve(data.rows.map((m) => m.detail))
        })
        .catch((err) => {
          client.release()
          reject(err)
        })
    })
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
  logSignin,
  getUser,
  updateUser,
  listAllUsers,
  listUserByDivisions,
  listUserIds,
  createAttempt,
  getUnlockedHints,
  getHintCredit,
  createHintIntent,
  getUserSolved,
  updateScore,
  listAllLogs
}
