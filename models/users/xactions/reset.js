var _ = require('lodash');
var errors = require('errors');

var middlewares = require('../../../middlewares');
var services = require('../../../services');
var utils = require('../../../utils');
var validators = require('../validators');

module.exports = function (route) {
  route.use(middlewares.json);

  route.use(function (req, res, next) {
    req.ctx.previleged = true;
    next();
  });

  route.use(function (req, res, next) {
    if (!req.user) {
      return next(errors.unauthorized());
    }
    middlewares.otp({
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
    services.update(req.ctx, function (err, user) {
      if (err) {
        return next(err);
      }
      res.status(204).end();
    });
  });
};
