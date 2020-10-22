var errors = require('errors');
var serandi = require('../../plugins/express');
var validators = require('../../validators');
var Users = require('./model');

var model = validators.model;

exports.update = function (req, res, next) {
  serandi.update(Users)(req, res, function (err) {
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
      serandi.otp({
        name: 'accounts-update',
        user: req.ctx.id
      })(req, res, next);
    });
  });
};
