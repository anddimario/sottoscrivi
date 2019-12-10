'use strict';
require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const i18n = require('i18n');

const db = require('./db');

const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const customerRouter = require('./routes/customer');
const passwordRecoveryRouter = require('./routes/passwordRecovery');
const stripeRouter = require('./routes/stripe');

const authorize = require('./middlewares/authorize');

var app = express();

i18n.configure({
  locales: process.env.AVAILABLE_LANGUAGES.split(','),
  defaultLocale: process.env.DEFAULT_LANGUAGE,
  cookie: 'locale',
  queryParameter: 'lang',
  directory: `${__dirname}/locales`,
  directoryPermissions: '755',
});

app.disable('x-powered-by');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new MongoStore({
    url: process.env.DATABASE_URL
  }),
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 2 // two weeks
  }
}));

// Set locales from session
app.use(i18n.init);

app.use(function (req, res, next) {
  res.locals.title = process.env.TITLE;
  res.locals.decimalConvert = (value) => {
    return value / 100;
  };
  // express helper for natively supported engines
  res.locals.__ = res.__ = function () {
    return i18n.__.apply(req, arguments);
  };

  // validation errors
  if (req.session.validationErrors) {
    res.locals.validationErrors = req.session.validationErrors;
    req.session.validationErrors = null;
  }
  // user info
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});

// check route permissions
app.use(async (req, res, next) => {
  next(await authorize(req));
});

app.use('/', indexRouter);
app.use('/password-recovery', passwordRecoveryRouter);
app.use('/admin', adminRouter);
app.use('/customer', customerRouter);
app.use('/stripe', stripeRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

db.connect({ url: process.env.DATABASE_URL, dbname: process.env.DATABASE_NAME }, () => {
  const port = process.env.PORT || 3000;
  app.listen(port, function () {
    console.log(`Listening on ${port}`);
  });
});
