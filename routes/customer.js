'use strict';
require('dotenv').config();
var express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const validation = require('../middlewares/validation');
const db = require('../db');

var router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    // get customer from stripe
    // https://stripe.com/docs/api/customers/retrieve
    const stripeInfo = await stripe.customers.retrieve(req.sottoscrivi.user.stripeId);
    const subData = stripeInfo.subscriptions.data[0];
    let locals;
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
    res.redirect('/customer');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
