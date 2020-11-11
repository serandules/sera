var errors = require('errors');
var middlewares = require('../../middlewares');
var validators = require('../../validators');
var Users = require('./model');

var model = validators.model;

exports.update = function (req, res, next) {
  middlewares.update(Users)(req, res, function (err) {
    if (err) {
      return next(err);
    }
    var ctx = req.ctx;
    model.updatable(ctx, function (err) {
      if (err) {
        return next(err);
      }
      var data = req.body;
      if (data.email !== ctx.found.email) {
        return next(errors.forbidden());
      }
      if (!data.password) {
        return next();
      }
      middlewares.otp({
        name: 'accounts-update',
        user: req.ctx.id
      })(req, res, next);
    });
  });
};
