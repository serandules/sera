var log = require('logger')('sera');
var _ = require('lodash');
var async = require('async');

var utils = require('./utils');
var validators = require('./validators');
var plugins = require('./plugins');
var middlewares = require('./middlewares');

var pluginz = function (toExtend, o, done) {
  if (!o.plugins) {
    return done();
  }
  var model = toExtend.model;
  o.plugins(model.schema, done);
};

var load = function (sera, extended, done) {
  var models = sera.models;
  async.each(Object.keys(extended), function (name, modelDone) {
    var o = extended[name];
    var toExtend = models[name];
    if (toExtend) {
      return pluginz(toExtend, o, modelDone);
    }
    models[name] = o;
    modelDone();
  }, done);
}

var sera = function (done) {
  sera.models = require('./models');
  sera.services = require('./services');
  boot(sera, done);
};

module.exports = sera;

var boot = function (sera, done) {
  sera.boot = function (scripts, done) {
    var initializers = require('./initializers');
    initializers.initialize(scripts, done);
  };

  sera.serve = function (options, done) {
    var services = sera.services;
    var models = sera.models;
    services.boot(models, options.server, options.prefix, done);
  };

  sera.extend = function (extended, done) {
    load(sera, extended, done);
  };

  sera.model = function (name) {
    var o = sera.models[name];
    return o && o.model;
  };

  sera.service = function (name) {
    var o = sera.models[name];
    return o && o.service;
  };

  sera.method = function (name, method, done) {
    var o = sera.models[name];
    done(null, o[method]);
  };

  sera.utils = utils;

  sera.validators = validators;

  sera.plugins = plugins;

  sera.middlewares = middlewares;

  done();
};
