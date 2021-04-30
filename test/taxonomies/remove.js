var log = require('logger')('service-taxonomies:test:remove');
var fs = require('fs');
var _ = require('lodash');
var errors = require('errors');
var should = require('should');
var request = require('request');
var sera = require('sera');
var pot = require('pot');

describe('DELETE /taxonomies/:id', function () {
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

    var create = function (user, done) {
        request({
            uri: pot.resolve('apis', '/v/taxonomies'),
            method: 'POST',
            auth: {
                bearer: user.token
            },
            json: {
                title: 'Brands',
                description: 'This is the brands taxonomy.'
            }
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(201);
            should.exist(b);
            should.exist(b.id);
            should.exist(b.title);
            should.exist(b.description);
            should.exist(r.headers['location']);
            r.headers['location'].should.equal(pot.resolve('apis', '/v/taxonomies/' + b.id));
            done(null, b);
        });
    };

    it('by unauthorized user', function (done) {
        create(client.users[0], function (err, binary) {
            if (err) {
                return done(err);
            }
            request({
                uri: pot.resolve('apis', '/v/taxonomies/' + binary.id),
                method: 'DELETE',
                auth: {
                    bearer: client.users[1].token
                },
                json: true
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
    });

    it('by authorized user', function (done) {
        create(client.users[0], function (err, binary) {
            if (err) {
                return done(err);
            }
            request({
                uri: pot.resolve('apis', '/v/taxonomies/' + binary.id),
                method: 'DELETE',
                auth: {
                    bearer: client.users[0].token
                },
                json: true
            }, function (e, r, b) {
                if (e) {
                    return done(e);
                }
                r.statusCode.should.equal(204);
                done();
            });
        });
    });

    it('non existing', function (done) {
        request({
            uri: pot.resolve('apis', '/v/taxonomies/59417b1220873e577df88aa2'),
            method: 'DELETE',
            auth: {
                bearer: client.users[0].token
            },
            json: true
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
});
