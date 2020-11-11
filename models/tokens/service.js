var log = require('logger')('models:tokens:service');
var bodyParser = require('body-parser');

var errors = require('errors');

var middlewares = require('../../middlewares');
var services = require('../../services');
var utils = require('../../utils');
var validators = require('./validators');
var Clients = require('../clients/model');
var Tokens = require('./model');

var MIN_ACCESSIBILITY = validators.MIN_ACCESSIBILITY;

var sendToken = function (req, res, next) {
  var clientId = req.body.client;
  Clients.findOne({
    _id: clientId
  }, function (err, client) {
    if (err) {
      log.error('clients:find-one', err);
      return next(errors.serverError());
    }
    if (!client) {
      return next(errors.unauthorized());
    }
    var location = req.body.location;
    var to = client.to;
    if (to.indexOf(location) === -1) {
      return next(errors.forbidden());
    }
    Tokens.findOne({
      user: req.user.id,
      client: client.id
    }, function (err, token) {
      if (err) {
        log.error('tokens:find-one', err);
        return next(errors.serverError());
      }
      var expires;
      if (token) {
        expires = token.accessibility();
        if (expires > MIN_ACCESSIBILITY) {
          res.send({
            id: token.id,
            access_token: token.access,
            refresh_token: token.refresh,
            expires_in: expires
          });
          return;
        }
      }
      services.create(req.ctx, function (err, token) {
        if (err) {
          log.error('tokens:create', err);
          return next(errors.serverError());
        }
        res.send({
          id: token.id,
          access_token: token.access,
          refresh_token: token.refresh,
          expires_in: token.accessible
        });
      });
    });
  });
};

module.exports = function (done) {
  var service = {
    auth: {
      GET: [
        '^\/$',
        '^\/.*'
      ],
      POST: [
        '^\/$',
        '^\/.*'
      ]
    },
    removeOne: true
  };

  service.findOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      middlewares.id,
      middlewares.findOne(Tokens),
      function (req, res, next) {
        services.findOne(req.ctx, function (err, token) {
          if (err) {
            return next(err);
          }
          res.send({
            id: token.id,
            user: req.user.id,
            client: token.client.id,
            access: token.access,
            refresh: token.refresh,
            createdAt: token.createdAt,
            accessible: token.accessible,
            refreshable: token.refreshable
          });
        });
      });
  };

  service.createOne = function (req, res, next) {
    middlewares.serve(req, res, next,
      bodyParser.urlencoded({extended: true}),
      middlewares.urlencoded,
      validators.grant,
      middlewares.create(Tokens),
      function (req, res, next) {
        sendToken(req, res, next);
      });
  };

  done(null, service);
};