var log = require('logger')('service-grants:test:find');
var should = require('should');
var request = require('request');
var pot = require('pot');
var errors = require('errors');

var sera = require('sera');

describe('GET /grants', function () {
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

  it('GET /grants/:id unauthorized', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unauthorized().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unauthorized().data.code);
      done();
    });
  });

  it('GET /grants/:id', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants/' + grant.id),
      method: 'GET',
      auth: {
        bearer: client.admin.token
      },
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b);
      should.exist(b.client);
      should.exist(b.user);
      b.client.should.equal(client.serandivesId);
      b.user.should.equal(client.users[0].profile.id);
      done();
    });
  });

  it('GET /grants', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'GET',
      auth: {
        bearer: client.admin.token
      },
      qs: {
        data: JSON.stringify({
          query: {
            client: client.serandivesId,
            user: client.users[0].profile.id
          },
          count: 1
        })
      },
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b);
      should.exist(b.length);
      should.exist(b[0].client);
      should.exist(b[0].user);
      b[0].client.should.equal(client.serandivesId);
      b[0].user.should.equal(client.users[0].profile.id);
      done();
    });
  });
});
