'use strict'
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcrypt');

const validation = require('../middlewares/validation');
const db = require('../db');

var router = express.Router();

router.get('/', (req, res) => {
  res.render('password-recovery');
});

router.get('/:token', async (req, res, next) => {
  try {
    // token checks (exists and not expired)
    const token = req.params.token;
    const user = await db.get().collection('users').findOne({ 'resetPassword.token': token });
    if (!user) {
      throw { message: 'Wrong request' };
    }
    const checkExpired = Date.now() - user.resetPassword.expire;
    const oneDay = 24 * 60 * 60 * 1000;
    if (checkExpired > oneDay) {
      throw { message: 'Token expired' };
    }
    res.render('password-recovery', { token });
  } catch (err) {
    next(err);
  }
});

router.post('/', validation, async (req, res, next) => {
  try {
    const email = req.body.email;
    // Check if user already exists
    const user = await db.get().collection('users').findOne({ email });
    if (!user) {
      req.redirect('back');
    }
    // create and store token
    const token = crypto
      .randomBytes(Math.ceil(20))
      .toString('hex') // convert to hexadecimal format
      .slice(0, 20); // return required number of characters
    const resetPassword = {
      expire: Date.now() + (24 * 60 * 60 * 1000), // valid for 24h
      token
    };
    await db.get().collection('users').updateOne({ email }, {
      $set: { resetPassword }
    });
    res.render('password-recovery', {
      applicationMessage: 'Check email'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/new', validation, async (req, res, next) => {
  try {
    const encryptedPassword = bcrypt.hashSync(req.body.password, 10);

    await db.get().collection('users').updateOne({ 'resetPassword.token': req.body.token }, {
      $unset: { resetPassword: '' },
      $set: { password: encryptedPassword }
    });
    res.redirect('/login');
  } catch (err) {
    next(err);
  }
});

module.exports = router;

