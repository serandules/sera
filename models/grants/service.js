var log = require('logger')('models:clients:service');
var bodyParser = require('body-parser');

var errors = require('errors');

var middlewares = require('../../middlewares');
var services = require('../../services');
var validators = require('./validators');
var utils = require('../../utils');
var Grants = require('./model');

module.exports = function (done) {
  var service = {
    auth: {},
    find: true,
    findOne: true,
    replaceOne: true,
    removeOne: true
  };

  service.createOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      bodyParser.json(),
      middlewares.json,
      middlewares.create(Grants),
      validators.create,
      function (req, res, next) {
        services.create(req.ctx, function (err, o) {
          if (err) {
            if (err.code === errors.mongoose.DuplicateKey) {
              return next(errors.conflict());
            }
            return next(err);
          }
          res.locate(o.id).status(201).send(o);
        });
      });
  };

  done(null, service);
};
