const messages = {
  unauthorizedAdmin: {
    message:
      'You must be an admin to view this page. If you believe this is an error, please reach out to tech.',
    title: 'Error: Unauthorized'
  },
  airtableError: {
    message:
      "Airtable service is currently unavailable. It's not on you, it's on us.",
    title: 'Error: Dependent Service Failure'
  },
  banned: {
    message:
      'Your team account has been disabled. Please contact the admins if you have questions.',
    title: 'Error: Account Disabled'
  },
  notFound: {
    message:
      "The page you're looking for is either a cusp, a corner, an asymptote, or just does not exist. Try again?",
    title: 'Error: Not Found'
  },
  captchaError: {
    message:
      "We're unable to verify you through reCAPTCHA. Please check your browser and try again.",
    title: 'Error: reCAPTCHA Verification Failed'
  },
  lockdown: {
    message:
      "We've been notified that the page you're trying to access is affected by an ongoing lockdown. Please try again later!",
    title: '⏳ Lockdown in Effect'
  },
  caughtRedHanded: {
    message:
      "Woah, slow down! What did you just try to pull there? Remember, we're always watching 👀",
    title: '🚨🚨🚨'
  }
}

module.exports = messages
