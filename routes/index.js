'use strict';
require('dotenv').config();
var express = require('express');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const validation = require('../middlewares/validation');
const db = require('../db');

var router = express.Router();

router.get('/', async (req, res) => {
  const plans = await stripe.plans.list();
  res.render('index', { plans: plans.data });
});

router.get('/login', (req, res) => {
  // display a message for new registered user
  const locals = {};
  if (req.query.session_id) {
    locals.applicationMessage = 'Welcome';
  }
  res.render('login', locals);
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await db.get().collection('users').findOne({ email: req.body.email });
    if (!user) {
      // eslint-disable-next-line require-atomic-updates
      req.session.validationErrors = [
        { message: 'The username does not exist' }
      ];
      return res.redirect('back');
    }
    const match = bcrypt.compareSync(req.body.password, user.password);
    if (!match) {
      // eslint-disable-next-line require-atomic-updates
      req.session.validationErrors = [
        { message: 'The username and password combination is invalid' }
      ];
      return res.redirect('back');
    }
    // eslint-disable-next-line require-atomic-updates
    req.session.user = {
      email: user.email
    };
    if (user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/customer');
    }
  } catch (err) {
    next(err);
  }
});

router.post('/registration', validation, async (req, res, next) => {
  try {
    // Check if plan exists
    const checkPlan = await stripe.plans.retrieve(req.body.plan);
    if (!checkPlan.id) {
      throw { message: 'Wrong plan' };
    }
    const email = req.body.email;
    // Check if user already exists
    const user = await db.get().collection('users').findOne({ email });
    if (user) {
      throw { message: 'Already exists' };
    }

    const encryptedPassword = bcrypt.hashSync(req.body.password, 10);
    const customer = {
      email,
      password: encryptedPassword,
      role: 'customer',
      registrationDate: Date.now()
    };
    await db.get().collection('users').insertOne(customer);
    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: req.body.email,
      payment_method_types: ['card'],
      subscription_data: {
        items: [{
          plan: req.body.plan,
        }],
      },
      success_url: `${process.env.SITE_URL}/login?session_id={CHECKOUT_SESSION_ID}`, // `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/cancel`,
    });
    res.render('checkout', {
      checkoutId: stripeSession.id,
      stripePK: process.env.STRIPE_PUBLIC,
      cart: stripeSession.display_items
    });
  } catch (err) {
    next(err);
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => res.redirect('/'));
});

// Webhook handler for asynchronous events.
router.post('/webhook', async (req, res) => {
  try {
    let eventType, data;
    // Check if webhook signing is configured.
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      const signature = req.headers['stripe-signature'];

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log('⚠️  Webhook signature verification failed.');
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      data = event.data;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = req.body.data;
      eventType = req.body.type;
    }
    console.log(data, eventType, data.object.customer_email)
    if (eventType === 'checkout.session.completed') {
      console.log('🔔  Payment received!');
      // set user as active
      await db.get().collection('users').updateOne({ email: data.object.customer_email }, {
        $set: {
          active: true,
          stripeId: data.object.customer
        }
      });
    }

    res.sendStatus(200);

  } catch (err) {
    console.log(err)
    res.sendStatus(500);
  }
});

// Language setup in cookie
router.get('/locale', (req, res) => {
  res.cookie('locale', req.query.lang, { maxAge: 900000, httpOnly: true });
  res.redirect('back');
});

module.exports = router;
