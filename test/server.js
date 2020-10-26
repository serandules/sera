var nconf = require('nconf').use('memory').argv().env();
var log = require('logger')('sera:test:server');
var vhost = require('vhost');
var express = require('express');
var morgan = require('morgan');
var cors = require('cors');
var compression = require('compression');
var format = require('string-template');

var utils = require('utils');
var serandi = require('serandi');
var throttle = require('throttle');
var errors = require('errors');
var sera = require('../index');

var server;

process.on('uncaughtException', function (err) {
  log.error('uncaught:threw', err);
  process.exit(1);
});

var loadServices = function (prefix, server, done) {
  sera({
    prefix: prefix,
    server: server,
    models: {}
  }, done);
};

exports.start = function (done) {
  var domain = utils.domain();
  var subdomain = utils.subdomain();
  var apps = express();
  var services = express();

  var version = 'v';
  var prefix = '/' + version;

  loadServices(prefix, services, function (err) {
    if (err) {
      return done(err);
    }
    apps.disable('x-powered-by');
    apps.use(morgan(':remote-addr :method :url :status :res[content-length] - :response-time ms'));
    apps.use(serandi.pond);
    apps.use(throttle(sera.model('tiers')));
    apps.use(cors({
      exposedHeaders: ['Content-Type', 'Link']
    }));
    apps.use(compression());

    apps.get('/status', function (req, res) {
      res.json({
        status: 'healthy'
      });
    });

    if (nconf.get('SERVER_TRUST_PROXY')) {
      apps.enable('trust proxy');
    }

    if (nconf.get('SERVER_SSL')) {
      apps.use(serandi.ssl);
    }

    var host = format(subdomain, {subdomain: 'apis'}) + '.' + domain;

    apps.use('/' + version, vhost(host, services));

    log.info('services:registered', 'host:%s, version:%s', host, version);
    apps.use(function (err, req, res, next) {
      if (err.status) {
        return res.pond(err);
      }
      log.error('server-error:errored', err);
      res.pond(errors.serverError());
    });

    apps.use(function (req, res, next) {
      res.pond(errors.notFound());
    });

    var port = nconf.get('PORT');
    server = apps.listen(port, function (err) {
      if (err) {
        return done(err);
      }
      log.info('server:started', 'port:%s', port);
      done();
    });
  });
};


exports.stop = function (done) {
  server.close(done);
};