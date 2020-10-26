var log = require('logger')('service-users:test:find');
var should = require('should');
var request = require('request');
var pot = require('pot');
var mongoose = require('mongoose');
var errors = require('errors');

describe('GET /users', function () {
  var user;
  var accessToken;
  var client;
  before(function (done) {
    pot.client(function (err, c) {
      if (err) {
        return done(err);
      }
      client = c;
      pot.createUser(c.serandivesId, {
        email: 'find-user@serandives.com',
        password: '1@2.Com',
        username: 'find-user'
      }, function (err, usr, token) {
        if (err) {
          return done(err);
        }
        user = usr;
        accessToken = token.access_token;
        // unverified user
        request({
          uri: pot.resolve('apis', '/v/users'),
          method: 'POST',
          headers: {
            'X-Captcha': 'dummy'
          },
          json: {
            email: 'unverified-user@serandives.com',
            password: '1@2.Com',
            username: 'unverified-user'
          }
        }, function (e, r, b) {
          if (e) {
            return done(e);
          }
          r.statusCode.should.equal(201);
          should.exist(b);
          should.exist(b.id);
          should.exist(b.email);
          b.email.should.equal('unverified-user@serandives.com');
          should.exist(r.headers['location']);
          r.headers['location'].should.equal(pot.resolve('apis', '/v/users/' + b.id));
          done();
        });
      });
    });
  });

  it('anonymous', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b.length);
      var unverified = false
      b.forEach(function (u) {
        should.exist(u.id);
        should.exist(u.username);
        Object.keys(u).length.should.equal(2);
        unverified = unverified || (u.username === 'unverified-user');
      });
      done();
    });
  });

  it('logged in unauthorized', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'GET',
      auth: {
        bearer: accessToken
      },
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b.length);
      var found = false;
      b.forEach(function (u) {
        should.exist(u.id);
        should.exist(u.username);
        if (u.id === user.id) {
          found.should.equal(false);
          return found = true;
        }
        Object.keys(u).length.should.equal(2);
      });
      found.should.equal(true);
      done();
    });
  });

  it('by admin', function (done) {
    pot.admin(function (err, admin) {
      if (err) {
        return done(err);
      }
      request({
        uri: pot.resolve('apis', '/v/users'),
        method: 'GET',
        auth: {
          bearer: admin.token
        },
        json: true
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(200);
        should.exist(b);
        should.exist(b.length);
        b.length.should.be.above(1);
        done();
      });
    });
  });
});
