'use strict';
require('dotenv').config();
var express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const db = require('../db');

var router = express.Router();

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
    console.log(data, eventType, data.object.customer_email);
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
    console.log(err);
    res.sendStatus(500);
  }
});

module.exports = router;
