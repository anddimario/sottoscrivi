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
  }
};

module.exports = (req, res, next) => {
  var validate = ajv.compile(validators[req.url]);
  var valid = validate(req.body);
  if (!valid) {
    req.session.validationErrors = validate.errors;
    return res.redirect('/');
  }
  next();
};
