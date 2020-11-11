var log = require('logger')('service-locations');
var bodyParser = require('body-parser');

var middlewares = require('../../middlewares');
var services = require('../../services');
var utils = require('../../utils');
var validators = require('./validators');
var Otps = require('./model');

module.exports = function (done) {
  var service = {
    auth: {},
    findOne: true
  };

  service.createOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      bodyParser.json(),
      middlewares.json,
      middlewares.create(Otps),
      validators.create,
      function (req, res, next) {
        Otps.remove({
          user: req.user.id,
          name: req.body.name
        }, function (err) {
          if (err) {
            return next(err);
          }
          services.create(req.ctx, function (err, otp) {
            if (err) {
              return next(err);
            }
            res.locate(otp.id).status(201).send(otp);
          });
        });
      });
  };

  done(null, service);
};

