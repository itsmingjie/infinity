/**
 * I know it is very sinful to base a large project
 * like this off of a commercial service, but I promise
 * there will be backups.
 */

const config = require('../config')
const AirtablePlus = require('airtable-plus')

const Puzzles = new AirtablePlus({
  baseID: config.airtable.base,
  apiKey: config.airtable.key,
  tableName: 'Puzzles'
})

const Levels = new AirtablePlus({
  baseID: config.airtable.base,
  apiKey: config.airtable.key,
  tableName: 'Levels'
})

const Hints = new AirtablePlus({
  baseID: config.airtable.base,
  apiKey: config.airtable.key,
  tableName: 'Hints'
})

// Pull all puzzles from Airtable
const getUnlockedPuzzles = (solutions) => {
  console.log(
    `Querying Airtable for puzzles ${
      solutions ? 'with' : 'without'
    } solutions...`
  )

  return new Promise((resolve, reject) => {
    Puzzles.read({
      view: 'Unlocked Puzzles',
      sort: [{ field: 'Order', direction: 'asc' }]
    })
      .then((data) => {
        if (!solutions) {
          // remove all solutions from the fetch
          data.forEach((v) => {
            delete v.fields.Solution
          })
        }

        console.log('Airtable puzzles loaded.')
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

// Pull all puzzles from Airtable
const getLevels = () => {
  console.log('Querying Airtable for levels...')

  return new Promise((resolve, reject) => {
    Levels.read()
      .then((data) => {
        console.log('Airtable levels loaded.')
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

const getHints = () => {
  console.log('Querying Airtable for hints...')

  return new Promise((resolve, reject) => {
    Hints.read()
      .then((data) => {
        console.log('Airtable hints loaded.')
        resolve(data)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

module.exports = { getUnlockedPuzzles, getLevels, getHints }
