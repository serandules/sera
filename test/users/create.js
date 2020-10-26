var log = require('logger')('service-users:test:create');
var errors = require('errors');
var should = require('should');
var request = require('request');
var pot = require('pot');

describe('POST /users', function () {

  before(pot.unthrottle);

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      console.log(b)
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
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'X-Captcha': 'dummy'
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

  it('without email address', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {}
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

  it('with malformed email address (no @)', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'serandives',
        password: '1@2.Com'
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

  it('with malformed email address (no .)', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'serandives@com'
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

  it('with malformed email address (@ after .)', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'serand.ives@com'
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

  it('without password', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-user@serandives.com'
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

  it('password without a number', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-user@serandives.com',
        password: 'Hello'
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

  it('password without an upper case letter', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-user@serandives.com',
        password: 'hello1'
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

  it('password without a lower case letter', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-user@serandives.com',
        password: 'HELLO1'
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

  it('password without a special character', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-user@serandives.com',
        password: 'Hello1'
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

  it('password same as email', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-User@serandives.com',
        password: 'create-use@Serandives.com'
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

  it('password same as username', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        username: 'create-user1',
        email: 'create-User@serandives.com',
        password: 'create-user1'
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

  it('with existing email', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'admin@serandives.com',
        password: '1@2.Com',
        username: 'admin'
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

  it('with existing username', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'admin-other@serandives.com',
        password: '1@2.Com',
        username: 'admin'
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

  it('with new email', function (done) {
    request({
      uri: pot.resolve('apis', '/v/users'),
      method: 'POST',
      headers: {
        'X-Captcha': 'dummy'
      },
      json: {
        email: 'create-user@serandives.com',
        password: '1@2.Com',
        username: 'create-user'
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(201);
      should.exist(b);
      should.exist(b.id);
      should.exist(b.email);
      b.email.should.equal('create-user@serandives.com');
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/users/' + b.id));
      done();
    });
  });

  it.skip('should prevent unintented email updates', function (done) {
    true.should.not.equal(false)
  })

  it.skip('should implement captcha', function (done) {
    true.should.not.equal(false)
  })
});
