'use strict';
require('dotenv').config();
var express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const db = require('../db');

var router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    // get customer from stripe
    // https://stripe.com/docs/api/customers/retrieve
    const stripeInfo = await stripe.customers.retrieve(req.sottoscrivi.user.stripeId);
    const subData = stripeInfo.subscriptions.data[0];
    let locals = {};
    if (subData) {
      locals = {
        billing: subData.billing,
        created: new Date(subData.created * 1000).toISOString().slice(0, 10),
        current_period_end: new Date(subData.current_period_end * 1000).toISOString().slice(0, 10),
        current_period_start: new Date(subData.current_period_start * 1000).toISOString().slice(0, 10),
        status: subData.status,
        plan: subData.plan.name
      };
    }
    if (stripeInfo.name) {
      locals.name = stripeInfo.name;
    }
    if (stripeInfo.phone) {
      locals.phone = stripeInfo.phone;
    }
    if (stripeInfo.address && stripeInfo.address.line1) {
      locals.address = stripeInfo.address.line1;
      locals.city = stripeInfo.address.city;
      locals.postalCode = stripeInfo.address.postal_code;
      locals.country = stripeInfo.address.country;
    }
    const plans = await stripe.plans.list();
    locals.plans = plans.data;
    res.render('customer/index', locals);
  } catch (err) {
    next(err);
  }
});

router.get('/deactive', async (req, res, next) => {
  try {
    const stripeInfo = await stripe.customers.retrieve(req.sottoscrivi.user.stripeId);
    const subData = stripeInfo.subscriptions.data[0];

    // https://stripe.com/docs/api/subscriptions/cancel
    await stripe.subscriptions.del(subData.id);

    // deactive user
    await db.get().collection('users').updateOne({ email: req.sottoscrivi.user.email }, {
      $set: {
        active: false,
      }
    });
    res.redirect('/customer');
  } catch (err) {
    next(err);
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const info = {
      address: {}
    };
    if (req.body.phone) {
      info.phone = req.body.phone;
    }
    if (req.body.address) {
      info.address.line1 = req.body.address;
    }
    if (req.body.name) {
      info.name = req.body.name;
    }
    if (req.body.city) {
      info.address.city = req.body.city;
    }
    if (req.body.postal_code) {
      info.address.postal_code = req.body.postal_code;
    }
    if (req.body.country) {
      info.address.country = req.body.country;
    }
    await stripe.customers.update(req.sottoscrivi.user.stripeId, info);

    res.redirect('back');
  } catch (err) {
    next(err);
  }
});

router.post('/buy', async (req, res, next) => {
  try {
    // Check if plan exists
    const checkPlan = await stripe.plans.retrieve(req.body.plan);
    if (!checkPlan.id) {
      throw { message: 'Wrong plan' };
    }
    const stripeSession = await stripe.checkout.sessions.create({
      customer: req.sottoscrivi.user.stripeId, // use customer id because user already exists, if email is used, stripe create a new user
      payment_method_types: ['card'],
      subscription_data: {
        items: [{
          plan: req.body.plan,
        }],
      },
      success_url: `${process.env.SITE_URL}/customer?session_id={CHECKOUT_SESSION_ID}`, // `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
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

module.exports = router;
