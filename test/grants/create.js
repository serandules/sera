var log = require('logger')('service-grants:test:create');
var errors = require('errors');
var should = require('should');
var request = require('request');
var pot = require('pot');

var sera = require('sera');

describe('POST /grants', function () {
  var client;
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
        done();
      });
    });
  });

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
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
      uri: pot.resolve('apis', '/v/grants'),
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

  it('without client', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'POST',
      json: {},
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

  it('with invalid client', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'POST',
      json: {
        client: 'serandives'
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

  it('without location', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'POST',
      json: {
        client: client.serandivesId
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

  it('with an invalid location', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'POST',
      json: {
        client: client.serandivesId,
        location: 'https://serandives.com'
      },
      auth: {
        bearer: client.users[0].token
      }
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

  it('with an invalid client', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'POST',
      json: {
        client: '5d18fe076c9c4e1b381514f0',
        location: 'https://serandives.com'
      },
      auth: {
        bearer: client.users[0].token
      }
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

  it('with valid client', function (done) {
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
      done();
    });
  });

  it('duplicate', function (done) {
    request({
      uri: pot.resolve('apis', '/v/grants'),
      method: 'POST',
      json: {
        client: client.serandivesId,
        location: 'http://test.serandives.com:3000/auth'
      },
      auth: {
        bearer: client.users[1].token
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
      b.user.should.equal(client.users[1].profile.id);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/grants/' + b.id));
      request({
        uri: pot.resolve('apis', '/v/grants'),
        method: 'POST',
        json: {
          client: client.serandivesId,
          location: 'http://test.serandives.com:3000/auth'
        },
        auth: {
          bearer: client.users[1].token
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
      });
    });
  });
});
