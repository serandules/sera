var log = require('logger')('models:clients:service');
var bodyParser = require('body-parser');

var errors = require('errors');

var serandi = require('../../plugins/express');
var mongooseUtils = require('../../utils/mongoose');
var validators = require('./validators');
var model = require('../../model');
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
    serandi.serve(req, res, next,
      bodyParser.json(),
      serandi.json,
      serandi.create(Grants),
      validators.create,
      function (req, res, next) {
        model.create(req.ctx, function (err, o) {
          if (err) {
            if (err.code === mongooseUtils.errors.DuplicateKey) {
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
