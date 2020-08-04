const Recaptcha = require('express-recaptcha').RecaptchaV3
const config = require('../config')
const recaptcha = new Recaptcha(
  config.recaptcha.site,
  config.recaptcha.secret,
  { callback: 'cb' }
)

module.exports = recaptcha
