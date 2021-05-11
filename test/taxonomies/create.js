var log = require('logger')('service-taxonomies:test:create');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var request = require('request');
var sera = require('../../index');
var pot = require('pot');

describe('POST /taxonomies', function () {
  var client;
  before(function (done) {
    pot.client(sera, function (err, c) {
      if (err) {
        return done(err);
      }
      client = c;
      done();
    });
  });

  var data = {
    title: 'Brands',
    description: 'This is the brands taxonomy.',
    tags: [
      {client: true, group: 'models', name: 'model', value: 'binaries'},
      {client: true, group: 'models', name: 'model', value: 'brands'}
    ]
  };

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
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
      uri: pot.resolve('apis', '/v/taxonomies'),
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

  it('without title', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        description: 'This is a sample taxonomy'
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

  it('without description', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Title'
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
  for (i = 0; i < 200001; i++) {
    bigger += 'x';
  }

  it('with bigger description', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Title',
        description: bigger
      },
      auth: {
        bearer: client.users[0].token
      }
    }, function (e, r, b) {
      if (e) {
        return done(e);
      }
      r.statusCode.should.equal(errors.payloadTooLarge().status);
      should.exist(b);
      should.exist(b.code);
      should.exist(b.message);
      b.code.should.equal(errors.payloadTooLarge().data.code);
      done();
    });
  });

  it('valid', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
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
      should.exist(b.title);
      b.title.should.equal(data.title);
      should.exist(b.description);
      b.description.should.equal(data.description);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/taxonomies/' + b.id));
      done();
    });
  });

  it('without client/server', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {group: 'models', name: 'model', value: 'binaries'}
        ]
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

  it('without group', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, name: 'model', value: 'binaries'}
        ]
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

  it('without name', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, group: 'models', value: 'binaries'}
        ]
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
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, group: 'models', name: 'model'}
        ]
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

  it('invalid group', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, group: 'invalid', name: 'model', value: 'binaries'}
        ]
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

  it('invalid name', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, group: 'models', name: 'invalid', value: 'binaries'}
        ]
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

  it('invalid value', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, group: 'models', name: 'model', value: 'invalid'}
        ]
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

  it('valid and invalid tags', function (done) {
    request({
      uri: pot.resolve('apis', '/v/taxonomies'),
      method: 'POST',
      json: {
        title: 'Brands',
        description: 'This is the brands taxonomy.',
        tags: [
          {client: true, group: 'models', name: 'model', value: 'binaries'},
          {client: true, group: 'models', name: 'model', value: 'invalid'}
        ]
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
});
