var _ = require('lodash');
var errors = require('errors');

var serandi = require('../../../plugins/express');
var model = require('../../../model');
var utils = require('../../../utils');
var validators = require('../validators');

module.exports = function (route) {
  route.use(serandi.json);

  route.use(function (req, res, next) {
    req.ctx.previleged = true;
    next();
  });

  route.use(function (req, res, next) {
    if (!req.user) {
      return next(errors.unauthorized());
    }
    serandi.otp({
      name: 'accounts-update',
      user: req.user.id
    })(req, res, next);
  });

  route.use(function (req, res, next) {
    var user = _.defaults(req.body, utils.json(req.user));
    if (!utils.permitted(user, user, 'recover') && !utils.permitted(user, user, 'verify')) {
      return next(errors.unauthorized());
    }
    var ctx = req.ctx;
    var overrides = ctx.overrides;
    overrides.status = 'registered';
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
