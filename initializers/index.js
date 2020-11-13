var log = require('logger')('initializers');
var _ = require('lodash');
var path = require('path');
var async = require('async');
var fs = require('fs');

var sera = require('../index');

var initScripts = fs.readdirSync(path.join(__dirname, '..', 'initializers', 'scripts'));

var coreScripts = function () {
  var scripts = [];
  initScripts.forEach(function (name) {
    scripts.push({
      name: name,
      initializer: require('./scripts/' + name)
    });
  });
  return scripts;
};

var zeroPad = function (name, length) {
  return (Array(length + 1).join('0') + name).slice(-length);
};

var filter = function (index, scripts) {
  var maxLength = 0
  var names = _.map(scripts, 'name');
  names.forEach(function (path) {
    var length = path.indexOf('-');
    maxLength = length > maxLength ? length : maxLength;
  });
  var paddedNames = {};
  _.map(names, function (path) {
    var length = path.length + maxLength - path.indexOf('-');
    paddedNames[zeroPad(path, length)] = path;
  });
  var byName = _.keyBy(scripts, 'name');
  var run = [];
  Object.keys(paddedNames).sort().forEach(function (name) {
    var n = paddedNames[name];
    if (!index[n]) {
      run.push(byName[n]);
    }
  });
  return run;
};

exports.initialize = function (scripts, done) {
  sera.model('configs').findOne({name: 'initializers'}).exec(function (err, config) {
    if (err) {
      return done(err);
    }
    var alreadyRan = config ? JSON.parse(config.value) : [];
    var index = {};
    alreadyRan.forEach(function (initializer) {
      index[initializer] = true;
    });
    var run = filter(index, coreScripts()).concat(filter(index, scripts));
    var ran = [];
    async.whilst(function () {
      return run.length;
    }, function (executed) {
      var entry = run.shift();
      entry.initializer(function (err) {
        if (err) {
          return executed(err);
        }
        ran.push(entry.name);
        executed();
      });
    }, function (err) {
      if (err) {
        return done(err);
      }
      alreadyRan = alreadyRan.concat(ran);
      sera.model('configs').update({name: 'initializers'}, {value: JSON.stringify(alreadyRan)}, {upsert: true}, done);
    });
  });
};
