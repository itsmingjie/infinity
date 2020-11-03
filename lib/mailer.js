const sgMail = require('@sendgrid/mail')
const config = require('../config')

sgMail.setApiKey(config.sendgrid.key)

const templates = {
  login: 'd-88333c7381bb41e79eed35ed59384802'
}

const sendLogin = (emails, login, password) => {
  const msg = {
    to: emails, // emails must be an array
    from: 'no-reply@puzzle-mail.integirls.org',
    templateId: templates.login,
    dynamic_template_data: {
      team: login,
      password: password
    }
  }

  sgMail.send(msg, (error, result) => {
    if (error) {
        console.log(error);
    } else {
        console.log(`Login information for team ${login} sent!`);
    }
 });
}

module.exports = { sendLogin }
