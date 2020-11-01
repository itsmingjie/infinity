// Flagger encrypts plaintext solutions into hashes
const bcrypt = require('bcrypt')
const { reject } = require('lodash')
const saltRounds = 10

const getHash = (plaintext) => {
  return new Promise((resolve, reject) => {
    bcrypt
      .hash(plaintext.toLowerCase(), saltRounds)
      .then((hash) => {
        resolve(hash)
      })
      .catch((e) => {
        reject(e)
      })
  })
}

const getHashBatch = async (plaintext) => {
  const promises = (plaintext.match(/[^\r\n]+/g) || []).map(async (pt) => {
    return getHash(pt)
  })

  const results = await Promise.all(promises)

  return results.join('\r\n')
}

const validateHash = (submitted, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(submitted, hash).then((result) => {
      resolve(result)
    }).catch((err) => {
      console.log(err)
      reject(err)
    })
  })
}

module.exports = { getHash, getHashBatch, validateHash }
