var log = require('logger')('service-users:test:find');
var should = require('should');
var request = require('request');
var pot = require('pot');
var mongoose = require('mongoose');
var errors = require('errors');

describe('GET /users/:id', function () {
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
        email: 'findone-user@serandives.com',
        password: '1@2.Com',
        username: 'findone-user'
      }, function (err, usr, token) {
        if (err) {
          return done(err);
        }
        user = usr;
        accessToken = token.access_token;
        done();
      });
    });
  });

  it('unauthorized', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users/' + user.id),
      method: 'GET',
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(200);
      should.exist(b.id);
      should.exist(b.username);
      Object.keys(b).length.should.equal(2);
      done();
    });
  });

  it('authorized', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users/' + user.id),
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
      should.exist(b);
      should.exist(b.id);
      should.exist(b.email);
      b.id.should.equal(user.id);
      b.email.should.equal('findone-user@serandives.com');
      request({
        uri: pot.resolve('apis', '/v/users/' + user.id),
        method: 'GET',
        json: true
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(200);
        should.exist(b);
        should.exist(b.id);
        should.exist(b.username);
        Object.keys(b).length.should.equal(2);
        request({
          uri: pot.resolve('apis', '/v/users/' + user.id),
          method: 'GET',
          qs: {
            data: JSON.stringify({
              fields: {
                username: 1
              }
            })
          },
          json: true
        }, function (e, r, b) {
          if (e) {
            return done(e);
          }
          r.statusCode.should.equal(200);
          should.exist(b);
          should.exist(b.id);
          should.exist(b.username);
          b.id.should.equal(user.id);
          done();
        });
      });
    });
  });
});
