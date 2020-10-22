var _ = require('lodash');
var errors = require('errors');

var serandi = require('../../../plugins/express');
var utils = require('../../../utils');
var model = require('../../../model');
var validators = require('../validators');

module.exports = function (route) {
  route.use(function (req, res, next) {
    req.ctx.previleged = true;
    next();
  });

  route.use(function (req, res, next) {
    if (!req.user) {
      return next(errors.unauthorized());
    }
    serandi.otp({
      name: 'accounts-confirm',
      user: req.user.id
    })(req, res, next);
  });

  route.use(function (req, res, next) {
    var user = utils.json(req.user);
    if (!utils.permitted(user, user, 'verify')) {
      return next(errors.unauthorized());
    }
    var ctx = req.ctx;
    var overrides = ctx.overrides;
    overrides.status = 'registered';
    delete user.password;
    req.body = user;
    next();
  });

  route.use(validators.update);

  route.use(function (req, res, next) {
    model.update(req.ctx, function (err, user) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  });
};
