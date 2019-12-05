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

    const users = await db.get().collection('users').find({ notifiedRegistration: { $exists: false } }, { email: 1 }).toArray();

    for (const user of users) {
      await sendemail('notifyRegistration', 'en', user);

      await db.get().collection('users').updateOne({ email: user.email }, { $set: { notifiedRegistration: true } });
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