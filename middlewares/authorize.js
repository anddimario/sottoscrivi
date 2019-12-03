'use strict';

const db = require('../db');

const permissions = {
  /* Example:
  '/admin': {
    roles: ['admin'],
    users: ['admin@example.com']
  }
  */
  '/customer': {
    roles: ['customer']
  },
  '/customer/deactive': {
    roles: ['customer']
  },
  '/admin/customers/list': {
    roles: ['admin']
  },
  '/admin/customers/details': {
    roles: ['admin']
  },
  '/admin/customers/delete': {
    roles: ['admin']
  }
};

module.exports = async (req) => {
  try {
    // use req.url beacuse req.route is available only on route
    // https://github.com/expressjs/express/issues/2093
    const routePermissions = permissions[req.url];
    // public routes
    if (!routePermissions) {
      return;
    }
    const unauthorizedMessage = { message: 'Not authorized', status: 421 };
    // Not authenticated user
    if (!req.session.user) {
      return unauthorizedMessage;
    }
    // get user
    const user = await db.get().collection('users').findOne({ email: req.session.user.email }, {
      password: 0
    });
    if (!user) {
      return unauthorizedMessage;
    }
    // check permission
    if (routePermissions) {
      let allowedByRole = false;
      let allowedByUser = false;
      // check by role
      if (routePermissions.roles && routePermissions.roles.includes(user.role)) {
        allowedByRole = true;
      }
      if (routePermissions.users && routePermissions.users.includes(user.email)) {
        allowedByUser = true;
      }
      // add user info to req
      // eslint-disable-next-line require-atomic-updates
      req.sottoscrivi = { user };
      // eslint-disable-next-line require-atomic-updates
      req.session.user.role = user.role;

      return allowedByRole || allowedByUser ? '' : unauthorizedMessage;
    }
    return;
  } catch (err) {
    return { message: err.toString() };
  }

};
