var log = require('logger')('service-configs:test:create');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var request = require('request');
var pot = require('pot');

describe('POST /configs', function () {
  var client;
  before(function (done) {
    pot.client(function (err, c) {
      if (err) {
        return done(err);
      }
      client = c;
      done();
    });
  });

  var data = {
    name: 'tests-c1',
    value: 'v1'
  };

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs'),
      method: 'POST',
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unsupportedMedia().status);
      should.exist(b);
      b = JSON.parse(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unsupportedMedia().data.code);
      done();
    });
  });

  it('with unsupported media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unsupportedMedia().status);
      should.exist(b);
      b = JSON.parse(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unsupportedMedia().data.code);
      done();
    });
  });

  it('without name', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs'),
      method: 'POST',
      json: {
        value: 'v1'
      },
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unprocessableEntity().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unprocessableEntity().data.code);
      done();
    });
  });

  it('without value', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs'),
      method: 'POST',
      json: {
        name: 'primary'
      },
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unprocessableEntity().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unprocessableEntity().data.code);
      done();
    });
  });

  var bigger = '';
  var i;
  for (i = 0; i < 10000; i++) {
    bigger += 'x';
  }

  it('with a huge value', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs'),
      method: 'POST',
      json: {
        name: 'tests-c3',
        value: [bigger]
      },
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unprocessableEntity().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unprocessableEntity().data.code);
      done();
    });
  });

  it('valid', function (done) {
    request({
      uri: pot.resolve('apis', '/v/configs'),
      method: 'POST',
      json: data,
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(201);
      should.exist(b);
      should.exist(b.name);
      should.exist(b.value);
      b.name.should.equal(data.name);
      b.value.should.equal(data.value);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/configs/' + b.id));
      request({
        uri: pot.resolve('apis', '/v/configs'),
        method: 'POST',
        json: data,
        auth: {
          bearer: client.users[0].token
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(errors.conflict().status);
        should.exist(b);
        should.exist(b.code);
        should.exist(b.message);
        b.code.should.equal(errors.conflict().data.code);
        done();
      })
    });
  });
});
