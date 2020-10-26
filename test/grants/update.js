var log = require('logger')('service-grants:test:update');
var _ = require('lodash');
var errors = require('errors');
var should = require('should');
var request = require('request');
var pot = require('pot');

var sera = require('sera');

describe('PUT /grants/:id', function () {
  var client;
  var grant;
  before(function (done) {
    pot.client(function (err, c) {
      if (err) {
        return done(err);
      }
      client = c;
      sera.model('grants').remove({}, function (err) {
        if (err) {
          return done(err);
        }
        request({
          uri: pot.resolve('apis', '/v/grants'),
          method: 'POST',
          json: {
            client: client.serandivesId,
            location: 'http://test.serandives.com:3000/auth'
          },
          auth: {
            bearer: client.users[0].token
          }
        }, function (e, r, b) {
          if (e) {
            return done(e);
          }
          r.statusCode.should.equal(201);
          should.exist(b);
          should.exist(b.client);
          should.exist(b.user);
          b.client.should.equal(client.serandivesId);
          b.user.should.equal(client.users[0].profile.id);
          should.exist(r.headers['location']);
          r.headers['location'].should.equal(pot.resolve('apis', '/v/grants/' + b.id));
          grant = b;
          done();
        });
      });
    });
  });

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'PUT',
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
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'PUT',
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

  it('with valid fields', function (done) {
    var g0 = _.cloneDeep(grant);
    request({
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'PUT',
      auth: {
        bearer: client.users[0].token
      },
      json: g0
    }, function (e, r, g1) {
      if (e) {
        return done(e);
      }
      should.exist(g1);
      should.exist(g1.client);
      should.exist(g1.user);
      g1.client.should.equal(client.serandivesId);
      g1.user.should.equal(client.users[0].profile.id);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/grants/' + g1.id));
      done();
    });
  });

  it('by unauthorized user', function (done) {
    var g0 = _.cloneDeep(grant);
    request({
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'PUT',
      auth: {
        bearer: client.users[1].token
      },
      json: g0
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.notFound().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.notFound().data.code);
      done();
    });
  });

  it('invalid id', function (done) {
    var g0 = _.cloneDeep(grant);
    request({
      uri: pot.resolve('apis', '/v/grants/invalid'),
      method: 'PUT',
      auth: {
        bearer: client.users[1].token
      },
      json: g0
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.notFound().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.notFound().data.code);
      done();
    });
  });

  it('by an authorized user', function (done) {
    var g0 = _.cloneDeep(grant);
    request({
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'PUT',
      auth: {
        bearer: client.admin.token
      },
      json: g0
    }, function (e, r, g1) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(g1);
      should.exist(g1.client);
      should.exist(g1.user);
      g1.client.should.equal(client.serandivesId);
      g1.user.should.equal(client.users[0].profile.id);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/grants/' + g1.id));
      done();
    });
  });
});
