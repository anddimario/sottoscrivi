'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const { promisify } = require('util');

const db = require('../db');

const connectMongo = promisify(db.connect); 

async function main () {
  try {

    const email = process.argv[2];
    const password = process.argv[3];
    const encryptedPassword = bcrypt.hashSync(password, 10);

    const admin = {
      email,
      password: encryptedPassword,
      role: 'admin'
    };
    await connectMongo(process.env.DATABASE_URL, process.env.DATABASE_NAME);
    await db.get().collection('users').insertOne(admin);
    process.exit();

  } catch (e) {
    /*eslint-disable */
    console.log(e);
    /*eslint-enable */
    process.exit(1);
  }
}

main();
