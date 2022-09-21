import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import path from 'path';
import hbs from 'nodemailer-express-handlebars';
interface SendMail {
  code: string;
  name: string;
  email: string;
}

export const sendForgotPasswordOtp: (params: SendMail) => void = ({
  code,
  name,
  email,
}) => {
  // var hbs = require('nodemailer-express-handlebars');

  // This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
  const auth = {
    auth: {
      api_key: '[API_KEY]',
      domain: '[MAILER_DOMAIN]',
    },
  };

  const nodemailerMailgun = nodemailer.createTransport(mg(auth));

  const handlebarOptions = {
    viewEngine: {
      extName: '.hbs',
      partialsDir: path.resolve('./src/mails/forgot-password'),
      defaultLayout: false,
    },
    viewPath: path.resolve('./src/mails/forgot-password'),
    extName: '.hbs',
  };

  nodemailerMailgun.use('compile', hbs(handlebarOptions));

  const payload = {
    from: 'no-reply@auctionmanagement.com',
    to: email, // An array if you have multiple recipients.
    // cc: 'second@domain.com',
    // bcc: 'secretagent@company.gov',
    subject: 'Auction Management Forgot Password Verification Code',
    // replyTo: 'reply2this@company.com',
    //You can use "html:" to send HTML email content. It's magic!
    // html: '<b>Wow Big powerful letters</b>',
    //You can use "text:" to send plain-text content. It's oldschool!
    // text: 'Mailgun rocks, pow pow!',
    template: 'email-verification',
    context: {
      name: name,
      code: code,
    },
  };
  nodemailerMailgun.sendMail(payload, (err, info) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      console.log(`Response: ${info}`);
    }
  });
};
