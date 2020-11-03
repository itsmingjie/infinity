const csv = require('fast-csv')
const fs = require('fs')
const { range } = require('lodash')
const slugify = require('slugify')
const db = require('../services/db')
const mailer = require('../lib/mailer')

const importTeams = (file) => {
  return new Promise((resolve, reject) => {
    const fileRows = []

    csv
      .parseFile(file.path)
      .on('data', async (data) => {
        const teamName = data[0]
        const MIN_LOGIN_LENGTH = 5
        const MAX_LOGIN_LENGTH = 12

        let slug = slugify(teamName, {
          lower: true,
          strict: true
        })
        for (let i in range(MIN_LOGIN_LENGTH - slug)) {
          slug += String.fromCharCode(97 + Math.floor(Math.random() * 26))
        }

        const teamLogin =
          slug.substring(0, MAX_LOGIN_LENGTH) +
          Math.floor(Math.random() * 90 + 10) // randomized team login with min length of (5 + 2)
        const division = Number(data[1])
        const emails = data[2]
          .replace(/(^[ \t]*\n)/gm, '')
          .replace(/\|/g, '')
          .replace(/\r\n/g, '\n')
          .replace(/\n/g, '|')
          .toLowerCase()
        const affiliation = data[3]
        const password = data[4]

        try {
          const uid = await db.createUser(
            teamLogin,
            password,
            division,
            affiliation,
            teamName,
            emails
          )
          console.log(`${teamLogin}:${uid} imported!`)
          mailer.sendLogin(emails.split('|'), teamLogin, password)
        } catch (e) {
          console.log(
            `${teamName} import error. Please manually create the account.`
          )
        }
      })
      .on('end', () => {
        console.log(fileRows)
        fs.unlinkSync(file.path)

        resolve()
      })
  })
}

module.exports = { importTeams }
