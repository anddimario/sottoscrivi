'use strict';
var Ajv = require('ajv');
var ajv = new Ajv({ allErrors: true });

const validators = {
  '/registration': {
    properties: {
      email: {
        format: 'email',
      },
      plan: {
        type: 'string',
      }
    },
    required: ['email', 'plan']
  },
  '/password-recovery': {
    properties: {
      email: {
        format: 'email',
      }
    },
    required: ['email']
  },
  '/password-recovery/new': {
    properties: {
      password: {
        type: 'string',
      },
      token: {
        type: 'string',
      }
    },
    required: ['password', 'token']
  }
};

module.exports = (req, res, next) => {
  var validate = ajv.compile(validators[req.originalUrl]);
  var valid = validate(req.body);
  if (!valid) {
    req.session.validationErrors = validate.errors;
    return res.redirect('/');
  }
  next();
};
