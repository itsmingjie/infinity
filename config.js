require('dotenv').config()

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  db: process.env.DATABASE_URL,
  redis: process.env.REDIS_URL,
  sessionSecret: process.env.SESSION_SECRET,
  airtable: {
    key: process.env.AIRTABLE_KEY,
    base: process.env.AIRTABLE_BASE
  },
  recaptcha: {
    site: process.env.RECAPTCHA_SITEKEY,
    secret: process.env.RECAPTCHA_SECRETKEY
  },
  bugsnag: {
    key: process.env.BUGSNAG_KEY
  },
  sendgrid: {
    key: process.env.SENDGRID_KEY
  },
  euler_url: process.env.EULER_URL,
  euler_token: process.env.EULER_TOKEN,
  final_puzzles: process.env.FINAL_PUZZLES.split(",").map(v => v.trim()),
  last_puzzle: process.env.LAST_PUZZLE,
  total_score: process.env.TOTAL_SCORE
}
