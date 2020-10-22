var log = require('logger')('sera');
var _ = require('lodash');
var async = require('async');

var all;

var plugins = function (o, done) {
  if (!o.plugins) {
    return done();
  }
  o.plugins(o.model, done);
};

var load = function (modelz, done) {
  if (all) {
    return done();
  }
  async.each(Object.keys(modelz), function (name, modelDone) {
    plugins(modelz[name], modelDone);
  }, function (err) {
    if (err) {
      return done(err);
    }
    all = modelz;
    done();
  });
}
var sera = function (o, done) {
  if (!done) {
    done = o;
    o = {};
  }
  var services = require('./services');
  var models = _.merge(o.models, require('./models'));

  load(models, function (err) {
    if (err) {
      return done(err);
    }
    if (!o.server) {
      return done();
    }
    services(models, o.server, o.prefix, done);
  });
};

module.exports = sera;

sera.model = function (name) {
  var o = all[name];
  return o && o.model;
};

sera.service = function (name) {
  var o = all[name];
  return o && o.service;
};

sera.method = function (name, method, done) {
  var o = all[name];
  done(null, o[method]);
};
