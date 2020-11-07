const config = require('../config')

const Discord = require('discord.js')
const bot = new Discord.Client()

let log

bot.login(config.discord.token)

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`)
})

const push = (msg) => {
    bot.channels.cache.get(config.discord.channel).send(msg)
}

module.exports = { push }