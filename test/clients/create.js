var log = require('logger')('service-clients:test:create');
var errors = require('errors');
var should = require('should');
var request = require('request');
var pot = require('pot');

describe('POST /clients', function () {
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

    it('with no media type', function (done) {
        request({
            uri: pot.resolve('apis', '/v/clients'),
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
            uri: pot.resolve('apis', '/v/clients'),
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
            uri: pot.resolve('apis', '/v/clients'),
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

    it('with invalid to', function (done) {
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                name: 'serandives',
                to: 'dummy'
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

    it('with name', function (done) {
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                name: 'serandives'
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
            should.exist(b.name);
            b.name.should.equal('serandives');
            should.exist(r.headers['location']);
            r.headers['location'].should.equal(pot.resolve('apis', '/v/clients/' + b.id));
            done();
        });
    });

    it('verify ownership', function (done) {
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                name: 'serandives',
                to: ['http://test.serandives.com/dummy']
            },
            auth: {
                bearer: client.users[0].token
            }
        }, function (e, r, c) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(201);
            should.exist(c);
            should.exist(c.id);
            should.exist(c.name);
            should.exist(c.to);
            c.name.should.equal('serandives');
            c.to.length.should.equal(1);
            c.to[0].should.equal('http://test.serandives.com/dummy');
            should.exist(r.headers['location']);
            r.headers['location'].should.equal(pot.resolve('apis', '/v/clients/' + c.id));
            request({
                uri: r.headers['location'],
                method: 'GET',
                auth: {
                    bearer: client.users[0].token
                },
                json: true
            }, function (e, r, b) {
                if (e) {
                    return done(e);
                }
                r.statusCode.should.equal(200);
                should.exist(b);
                should.exist(b.id);
                should.exist(b.name);
                b.id.should.equal(c.id);
                b.name.should.equal(c.name);
                done();
            });
        });
    });


    it('with name and to', function (done) {
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                name: 'serandives',
                to: ['http://test.serandives.com/dummy']
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
            should.exist(b.id);
            should.exist(b.name);
            should.exist(b.to);
            b.name.should.equal('serandives');
            b.to.length.should.equal(1);
            b.to[0].should.equal('http://test.serandives.com/dummy');
            should.exist(r.headers['location']);
            r.headers['location'].should.equal(pot.resolve('apis', '/v/clients/' + b.id));
            done();
        });
    });

    it('with name and malformed to (protocol)', function (done) {
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                to: 'test.serandives.com/dummy'
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

    it('with name and malformed to (url length)', function (done) {
        var url = 'https://test.serandives.com/dummy';
        for (var i = 0; i < 2000; i++) {
            url += 'abcdef';
        }
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                name: 'serandives',
                to: [url]
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


    it('with name and malformed to (size)', function (done) {
        var url = 'https://test.serandives.com/dummy';
        var to = [];
        for (var i = 0; i < 6; i++) {
            to.push(url);
        }
        request({
            uri: pot.resolve('apis', '/v/clients'),
            method: 'POST',
            json: {
                name: 'serandives',
                to: to
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
