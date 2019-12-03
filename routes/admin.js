'use strict';

require('dotenv').config();
var express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const db = require('../db');

var router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/admin/customers/list');
});

router.get('/customers/list', async function (req, res, next) {
  try {
    const params = {};
    if (req.query.after) {
      params.starting_after = req.query.after;
    }
    const customers = await stripe.customers.list(params);
    const locals = {
      customers: customers.data
    };
    if (customers.has_more) {
      const last = customers.data.length - 1;
      locals.starting_after = customers.data[last].id;
    }
    res.render('admin/customers', locals);
  } catch (err) {
    next(err);
  }
});


router.get('/customers/details', async function (req, res, next) {
  try {
    const stripeInfo = await stripe.customers.retrieve(req.query.id);
    const subData = stripeInfo.subscriptions.data[0];
    const locals = {
      customerId: req.params.id,
      billing: subData.billing,
      created: new Date(subData.created * 1000).toISOString().slice(0, 10),
      current_period_end: new Date(subData.current_period_end * 1000).toISOString().slice(0, 10),
      current_period_start: new Date(subData.current_period_start * 1000).toISOString().slice(0, 10),
      status: subData.status,
      plan: subData.plan.name
    };
    res.render('admin/customerDetails', locals);
  } catch (err) {
    next(err);
  }
});

router.get('/customers/delete', async function (req, res, next) {
  try {
    await stripe.customers.del(req.query.id);
    await db.get().collection('users').remove({ stripeId: req.query.id });
    res.redirect('/admin/customers/list');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
