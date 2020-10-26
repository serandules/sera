var log = require('logger')('service-users:test:find');
var should = require('should');
var request = require('request');
var pot = require('pot');
var errors = require('errors');

var sera = require('sera');

describe('POST /users (recover)', function () {
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
        email: 'test-recover-user@serandives.com',
        password: '1@2.Com',
        username: 'test-recover-user'
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

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Action': 'recover'
      },
      json: true
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.unsupportedMedia().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.unsupportedMedia().data.code);
      done();
    });
  });

  it('no captcha', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Action': 'recover'
      },
      json: {
        query: {
          email: 'test-recover-user@serandives.com'
        }
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.forbidden().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.forbidden().data.code);
      done();
    });
  });

  it('no action', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        query: {
          email: 'test-recover-user@serandives.com'
        }
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

  it('successful', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy',
        'X-Action': 'recover'
      },
      json: {
        query: {
          email: 'test-recover-user@serandives.com'
        }
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(204);
      should.not.exist(b);
      sera.model('users').findOne({
        email: 'test-recover-user@serandives.com'
      }, function (err, user) {
        if (err) {
          return done(err);
        }
        sera.model('otps').findOne({
          name: 'accounts-update',
          user: user.id
        }, function (err, otp) {
          if (err) {
            return done(err);
          }
          request({
            uri: pot.resolve('apis', '/v/users/' + user.id),
            method: 'POST',
            headers: {
              'X-OTP': otp.strong,
              'X-Action': 'reset'
            },
            json: {
              password: '2@1.Com'
            }
          }, function (e, r, b) {
            if (e) {
              return done(e);
            }
            r.statusCode.should.equal(204);
            should.not.exist(b);
            request({
              uri: pot.resolve('apis', '/v/tokens'),
              method: 'POST',
              headers: {
                'X-Captcha': 'dummy'
              },
              form: {
                client_id: client.serandivesId,
                grant_type: 'password',
                username: 'test-recover-user@serandives.com',
                password: '2@1.Com',
                redirect_uri: pot.resolve('accounts', '/auth')
              },
              json: true
            }, function (e, r, b) {
              if (e) {
                return done(e);
              }
              r.statusCode.should.equal(200);
              should.exist(b);
              should.exist(b.id);
              should.exist(b.access_token);
              should.exist(b.refresh_token);
              should.exist(b.expires_in);
              b.expires_in.should.be.above(0)
              done();
            });
          });
        });
      });
    });
  });
});
