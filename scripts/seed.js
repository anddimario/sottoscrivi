'use strict';

// Create seed data for testing

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const db = require('../db');

const connectMongo = promisify(db.connect);

async function main() {
  try {
    const email = 'e2e@example.com';
    const password = 'password';

    await connectMongo({ url: process.env.DATABASE_URL, dbname: process.env.DATABASE_NAME });

    if (process.argv[2] === 'create') {

      const encryptedPassword = bcrypt.hashSync(password, 10);

      const checkUser = await db.get().collection('users').findOne({ email });

      if (checkUser) {
        process.exit();
      }

      const stripeCustomer = await stripe.customers.create({
        email,
      });
      const user = {
        email,
        password: encryptedPassword,
        role: 'customer',
        stripeId: stripeCustomer.id,
        active: true
      };
      await db.get().collection('users').insertOne(user);
    } else if (process.argv[2] === 'remove') {
      await db.get().collection('users').remove({ email: 'e2e.admin@example.com' });
      await db.get().collection('users').remove({ email });
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
