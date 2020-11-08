const config = require('../config')

const Discord = require('discord.js')
const bot = new Discord.Client()
const networkInterfaces = require('os').networkInterfaces

let log

bot.login(config.discord.token)

const getLocalExternalIP = () =>
  []
    .concat(...Object.values(networkInterfaces()))
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .pop().address

const systemHash = Buffer.from(getLocalExternalIP()).toString('base64').toUpperCase().substring(0, 6)

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!}`)
  push(`🤖 Server **${systemHash}** restarted at **${getLocalExternalIP()}**.`)
})


const push = (msg) => {
  bot.channels.cache.get(config.discord.channel).send(msg)
}

module.exports = { push }
