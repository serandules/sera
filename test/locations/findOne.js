var log = require('logger')('service-locations:test:find');
var async = require('async');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var request = require('request');
var sera = require('sera');
var pot = require('pot');

describe('GET /locations', function () {
    var client;
    var groups;
    before(function (done) {
        pot.drop('locations', function (err) {
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
                    createLocations(client.users[0], 1, function (err) {
                        if (err) {
                            return done(err);
                        }
                        createLocations(client.users[1], 1, done);
                    });
                });
            });
        });
    });

    var location = {
        latitude: 6.9102825,
        longitude: 79.8712862,
        name: 'Bandaranaike Memorial International Conference Hall',
        line1: 'BMICH Office',
        line2: 'Bauddhaloka Mawatha',
        city: 'Colombo',
        postal: '00700',
        district: 'Colombo',
        province: 'Western',
        state: 'Western',
        country: 'LK'
    };

    var validateLocations = function (locations) {
        locations.forEach(function (location) {
            should.exist(location.id);
            should.exist(location.user);
            should.exist(location.createdAt);
            should.exist(location.modifiedAt);
            should.not.exist(location._id);
            should.not.exist(location.__v);
        });
    };

    var payload = function (without) {
        var clone = _.cloneDeep(location);
        without = without || [];
        without.forEach(function (w) {
            delete clone[w];
        });
        return clone;
    };

    var createLocations = function (user, count, done) {
        async.whilst(function () {
            return count-- > 0
        }, function (created) {
            var location = payload();
            location.city = 'Colombo' + count;
            request({
                uri: pot.resolve('apis', '/v/locations'),
                method: 'POST',
                auth: {
                    bearer: user.token
                },
                json: location
            }, function (e, r, b) {
                if (e) {
                    return created(e);
                }
                r.statusCode.should.equal(201);
                should.exist(b);
                should.exist(b.id);
                should.exist(b.country);
                b.country.should.equal('LK');
                should.exist(r.headers['location']);
                r.headers['location'].should.equal(pot.resolve('apis', '/v/locations/' + b.id));
                created();
            });
        }, done);
    };

    it('invalid id', function (done) {
        request({
            uri: pot.resolve('apis', '/v/locations/undefined'),
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
            uri: pot.resolve('apis', '/v/locations'),
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
            validateLocations(b);
            request({
                uri: pot.resolve('apis', '/v/locations/' + b[0].id),
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
                validateLocations([b]);
                done();
            });
        });
    });

    it('others cannot access', function (done) {
        request({
            uri: pot.resolve('apis', '/v/locations'),
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
            validateLocations(b);
            request({
                uri: pot.resolve('apis', '/v/locations/' + b[0].id),
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
            uri: pot.resolve('apis', '/v/locations'),
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
            validateLocations(b);
            var location = b[0];
            request({
                uri: pot.resolve('apis', '/v/locations/' + location.id),
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
                    uri: pot.resolve('apis', '/v/locations/' + location.id),
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
                    pot.publish('locations', location.id, client.users[0].token, client.admin.token, function (err) {
                        if (err) {
                            return done(err);
                        }
                        request({
                            uri: pot.resolve('apis', '/v/locations/' + location.id),
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
                            validateLocations([b]);
                            request({
                                uri: pot.resolve('apis', '/v/locations/' + location.id),
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
                                validateLocations([b]);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
