'use strict';
require('dotenv').config();

const nodemailer = require('nodemailer');
const pug = require('pug');
const fs = require('fs');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

const sendemail = async (reference, lang, params) => {
  const smtpParams = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE, // true for 465, false for other ports
    tls: {
      rejectUnauthorized: false
    }
  };
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    smtpParams.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    };    
  }

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport(smtpParams);

  // Compile a function
  const fn = pug.compileFile(`${__dirname}/../templates/${lang}/${reference}.pug`, {});

  // Render the function
  const html = fn(params);

  // Get locales for subject
  const locales = await readFile(`${__dirname}/../locales/${lang}.json`, { encoding: 'utf8' });

  // send mail with defined transport object
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`, // sender address
    to: params.email, // list of receivers
    subject: JSON.parse(locales)[reference], // Subject line
    //  text: 'Hello world?', // plain text body
    html: html // html body
  });


};

module.exports = {
  sendemail
};