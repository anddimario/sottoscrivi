'use strict';

// Send email for registration

require('dotenv').config();
const { promisify } = require('util');
const { sendemail } = require('../libs/utils');

const db = require('../db');

const connectMongo = promisify(db.connect);

async function main() {
  try {
    await connectMongo({ url: process.env.DATABASE_URL, dbname: process.env.DATABASE_NAME });

    const users = await db.get().collection('users').find({ resetPassword: { $exists: true } }, { email: 1, lang: 1, resetPassword: 1 }).toArray();

    for (const user of users) {
      let lang = 'en';
      if (user.lang) {
        lang = user.lang;
      }
      if (!user.resetPassword.sent) {
        const locals = {
          token: user.resetPassword.token,
          site_url: process.env.SITE_URL
        };
        await sendemail('notifyResetPassword', lang, user, locals);
        await db.get().collection('users').updateOne({ email: user.email }, { $set: { 'resetPassword.sent': true } });
      }

    }
    process.exit();

  } catch (e) {
    /*eslint-disable */
    console.log(e);
    /*eslint-enable */
    process.exit(1);
  }
}

main();