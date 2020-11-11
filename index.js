var log = require('logger')('sera');
var _ = require('lodash');
var async = require('async');

var utils = require('./utils');
var validators = require('./validators');
var plugins = require('./plugins');
var middlewares = require('./middlewares');

var allModels = {};

var pluginz = function (toExtend, o, done) {
  if (!o.plugins) {
    return done();
  }
  var model = toExtend.model;
  o.plugins(model.schema, done);
};

var load = function (models, done) {
  async.each(Object.keys(models), function (name, modelDone) {
    var o = models[name];
    var toExtend = allModels[name];
    if (toExtend) {
      return pluginz(toExtend, o, modelDone);
    }
    pluginz(name, o, function (err) {
      if (err) {
        return modelDone(err);
      }
      allModels[name] = o;
      modelDone();
    });
  }, done);
}

var sera = function (options, done) {
  if (!done) {
    done = options;
    options = {};
  }

  var services = require('./services');
  var models = require('./models');

  load(models, function (err) {
    if (err) {
      return done(err);
    }

    sera.services = services;

    boot(sera, function (err) {
      if (err) {
        return done(err);
      }

      if (!options.server) {
        return done();
      }

      services.boot(models, options.server, options.prefix, done);
    });
  });
};

module.exports = sera;

var boot = function (sera, done) {
  sera.boot = function (scripts, done) {
    var initializers = require('./initializers');
    initializers.initialize(scripts, done);
  };

  sera.extend = function (models, done) {
    load(models, done);
  };

  sera.model = function (name) {
    var o = allModels[name];
    return o && o.model;
  };

  sera.service = function (name) {
    var o = allModels[name];
    return o && o.service;
  };

  sera.method = function (name, method, done) {
    var o = allModels[name];
    done(null, o[method]);
  };

  sera.utils = utils;

  sera.validators = validators;

  sera.plugins = plugins;

  sera.middlewares = middlewares;

  done();
};
