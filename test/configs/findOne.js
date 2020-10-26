var log = require('logger')('service-configs:test:create');
var nconf = require('nconf');
var errors = require('errors');
var should = require('should');
var request = require('request');
var async = require('async');
var pot = require('pot');
var sera = require('sera');

describe('GET /configs/:id', function () {
  var configs;

  var findOne = function (name) {
    var i;
    var config;
    for (i = 0; i < configs.length; i++) {
      config = configs[i];
      if (config.name === name) {
        return config;
      }
    }
    return null;
  };

  before(function (done) {
    sera.method('configs', 'find', function (err, find) {
      find(function (err, b) {
        if (err) {
          return done(err);
        }
        configs = b;
        done();
      });
    });
  });

  it('GET /configs/boot', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs/' + findOne('boot').id),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b);
      should.exist(b.name);
      b.name.should.equal('boot');
      should.exist(b.value);
      should.exist(b.value.clients);
      should.exist(b.value.clients.serandives);
      done();
    });
  });

  it('GET /configs/groups', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs/' + findOne('groups').id),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b);
      should.exist(b.name);
      b.name.should.equal('groups');
      should.exist(b.value);
      should.exist(b.value.length);
      b.value.length.should.equal(3);
      b.value.forEach(function (group) {
        should.exist(group.name);
        ['public', 'anonymous', 'admin'].indexOf(group.name).should.not.equal(-1);
      });
      done();
    });
  });

  it('GET /configs/:menu', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs/' + findOne('menus').id),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b);
      should.exist(b.name);
      b.name.should.equal('menus');
      should.exist(b.value);
      var names = Object.keys(b.value);
      should.exist(names.length);

      async.each(names, function (name, eachDone) {
        request({
          uri: pot.resolve('apis', '/v/configs/' + b.value[name]),
          method: 'GET',
          json: true
        }, function (e, r, b) {
          if (e) {
            return eachDone(e);
          }
          r.statusCode.should.equal(200);
          should.exist(b);
          should.exist(b.name);
          b.name.should.equal(name);
          should.exist(b.value);
          eachDone();
        });
      }, done);
    });
  });

  it('GET /configs/other', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs/other'),
      method: 'GET',
      json: {}
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unauthorized().status);
      should.exist(b);
      b.code.should.equal(errors.unauthorized().data.code);
      done();
    });
  });
});
