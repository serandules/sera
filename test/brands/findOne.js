var log = require('logger')('service-brands:test:find');
var async = require('async');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var request = require('request');
var sera = require('../../index');
var pot = require('pot');

describe('GET /brands', function () {
    var client;
    var groups;
    before(function (done) {
        pot.drop('brands', function (err) {
            if (err) {
                return done(err);
            }
            pot.client(sera, function (err, c) {
                if (err) {
                    return done(err);
                }
                client = c;
                pot.groups(function (err, g) {
                    if (err) {
                        return done(err);
                    }
                    groups = g;
                    createtaxonomies(client.users[0], 1, function (err) {
                        if (err) {
                            return done(err);
                        }
                        createtaxonomies(client.users[1], 1, done);
                    });
                });
            });
        });
    });

    var page = {
        title: 'Honda',
        description: 'This is the honda brand.'
    };

    var validatetaxonomies = function (brands) {
        brands.forEach(function (page) {
            should.exist(page.id);
            should.exist(page.user);
            should.exist(page.createdAt);
            should.exist(page.modifiedAt);
            should.exist(page.title);
            should.exist(page.description);
            should.not.exist(page._id);
            should.not.exist(page.__v);
        });
    };

    var payload = function (without) {
        var clone = _.cloneDeep(page);
        without = without || [];
        without.forEach(function (w) {
            delete clone[w];
        });
        return clone;
    };

    var createtaxonomies = function (user, count, done) {
        async.whilst(function () {
            return count-- > 0
        }, function (created) {
            var taxonomy = payload();
            request({
                uri: pot.resolve('apis', '/v/brands'),
                method: 'POST',
                auth: {
                    bearer: user.token
                },
                json: taxonomy
            }, function (e, r, b) {
                if (e) {
                    return created(e);
                }
                r.statusCode.should.equal(201);
                should.exist(b);
                should.exist(b.id);
                should.exist(b.title);
                b.title.should.equal(taxonomy.title);
                should.exist(b.description);
                b.description.should.equal(taxonomy.description);
                should.exist(r.headers['location']);
                r.headers['location'].should.equal(pot.resolve('apis', '/v/brands/' + b.id));
                created();
            });
        }, done);
    };

    it('invalid id', function (done) {
        request({
            uri: pot.resolve('apis', '/v/brands/undefined'),
            method: 'GET',
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

    it('owner can access', function (done) {
        request({
            uri: pot.resolve('apis', '/v/brands'),
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
            should.exist(b.length);
            b.length.should.equal(1);
            validatetaxonomies(b);
            request({
                uri: pot.resolve('apis', '/v/brands/' + b[0].id),
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
                validatetaxonomies([b]);
                done();
            });
        });
    });

    it('others cannot access', function (done) {
        request({
            uri: pot.resolve('apis', '/v/brands'),
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
            should.exist(b.length);
            b.length.should.equal(1);
            validatetaxonomies(b);
            request({
                uri: pot.resolve('apis', '/v/brands/' + b[0].id),
                method: 'GET',
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

    it('can be accessed by anyone when public', function (done) {
        request({
            uri: pot.resolve('apis', '/v/brands'),
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
            should.exist(b.length);
            b.length.should.equal(1);
            validatetaxonomies(b);
            var page = b[0];
            request({
                uri: pot.resolve('apis', '/v/brands/' + page.id),
                method: 'GET',
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
                request({
                    uri: pot.resolve('apis', '/v/brands/' + page.id),
                    method: 'GET',
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
                    pot.publish('brands', page.id, client.users[0].token, client.admin.token, function (err) {
                        if (err) {
                            return done(err);
                        }
                        request({
                            uri: pot.resolve('apis', '/v/brands/' + page.id),
                            method: 'GET',
                            auth: {
                                bearer: client.users[1].token
                            },
                            json: true
                        }, function (e, r, b) {
                            if (e) {
                                return done(e);
                            }
                            r.statusCode.should.equal(200);
                            should.exist(b);
                            validatetaxonomies([b]);
                            request({
                                uri: pot.resolve('apis', '/v/brands/' + page.id),
                                method: 'GET',
                                auth: {
                                    bearer: client.users[2].token
                                },
                                json: true
                            }, function (e, r, b) {
                                if (e) {
                                    return done(e);
                                }
                                r.statusCode.should.equal(200);
                                should.exist(b);
                                validatetaxonomies([b]);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
