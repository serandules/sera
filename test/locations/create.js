var log = require('logger')('service-locations:test:create');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var request = require('request');
var sera = require('sera');
var pot = require('pot');

describe('POST /locations', function () {
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

  var without = function (without) {
    var clone = _.cloneDeep(data);
    without = without || [];
    without.forEach(function (w) {
      delete clone[w];
    });
    return clone;
  };

  var invalid = function (name, value) {
    var clone = _.cloneDeep(data);
    clone[name] = value;
    return clone;
  };

  it('with no media type', function (done) {
    request({
      uri: pot.resolve('apis', '/v/locations'),
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
      uri: pot.resolve('apis', '/v/locations'),
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

  var withoutFields = [
    'latitude',
    'longitude',
    'line1',
    'city',
    'postal',
    'district',
    'province',
    'country'
  ];

  withoutFields.forEach(function (field) {
    it('without ' + field, function (done) {
      request({
        uri: pot.resolve('apis', '/v/locations'),
        method: 'POST',
        json: without([field]),
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

  var bigger = '';
  var i;
  for (i = 0; i < 500; i++) {
    bigger += 'x';
  }
  var invalidFields = {
    latitude: [120, '120', {foo: 'bar'}],
    longitude: [200, '200', {foo: 'bar'}],
    name: [bigger],
    line1: [bigger],
    line2: [bigger],
    city: [bigger],
    district: [bigger],
    province: [bigger],
    state: [bigger],
    country: ['LKR']
  };

  Object.keys(invalidFields).forEach(function (field) {
    var values = invalidFields[field];
    values.forEach(function (value, i) {
      it('invalid ' + field + ' with value ' + i, function (done) {
        request({
          uri: pot.resolve('apis', '/v/locations'),
          method: 'POST',
          json: invalid(field, value),
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
  });

  it('valid', function (done) {
    request({
      uri: pot.resolve('apis', '/v/locations'),
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
      should.exist(b.latitude);
      b.latitude.should.equal(data.latitude);
      should.exist(b.longitude);
      b.longitude.should.equal(data.longitude);
      should.exist(r.headers['location']);
      r.headers['location'].should.equal(pot.resolve('apis', '/v/locations/' + b.id));
      done();
    });
  });

  it('valid with visibility overriding', function (done) {
    pot.groups(function (err, groups) {
      if (err) return done(err);
      var d = _.clone(data);
      d._ = {
        visibility: {
          'invalid': {
            [groups.anonymous.id]: ['city', 'postal']
          }
        }
      };
      request({
        uri: pot.resolve('apis', '/v/locations'),
        method: 'POST',
        json: d,
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
        d._ = {
          visibility: {
            'published': {
              abcdef: ['city', 'postal']
            }
          }
        };
        request({
          uri: pot.resolve('apis', '/v/locations'),
          method: 'POST',
          json: d,
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
          d._ = {
            visibility: {
              'published': {
                [groups.anonymous.id]: ['city', 'postal', 'invalid']
              }
            }
          };
          request({
            uri: pot.resolve('apis', '/v/locations'),
            method: 'POST',
            json: d,
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
            d._ = {
              visibility: {
                'published': {
                  [groups.public.id]: ['city', 'postal']
                }
              }
            };
            request({
              uri: pot.resolve('apis', '/v/locations'),
              method: 'POST',
              json: d,
              auth: {
                bearer: client.users[0].token
              }
            }, function (e, r, location) {
              if (e) {
                return done(e);
              }
              r.statusCode.should.equal(201);
              should.exist(location);
              should.exist(location.latitude);
              location.latitude.should.equal(data.latitude);
              should.exist(location.longitude);
              location.longitude.should.equal(data.longitude);
              should.exist(r.headers['location']);
              r.headers['location'].should.equal(pot.resolve('apis', '/v/locations/' + location.id));
              pot.publish('locations', location.id, client.users[0].token, client.admin.token, function (err) {
                if (err) {
                  return done(err);
                }
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
                  should.exist(b.id);
                  should.exist(b.city);
                  should.exist(b.postal);
                  should.not.exist(b.name);
                  should.not.exist(b.latitude);
                  should.not.exist(b.longitude);
                  should.not.exist(b.line1);
                  should.not.exist(b.line2);
                  request({
                    uri: pot.resolve('apis', '/v/locations/' + location.id),
                    method: 'GET',
                    json: true
                  }, function (e, r, b) {
                    if (e) {
                      return done(e);
                    }
                    r.statusCode.should.equal(200);
                    should.exist(b);
                    should.exist(b.id);
                    should.not.exist(b.city);
                    should.not.exist(b.postal);
                    should.not.exist(b.name);
                    should.not.exist(b.latitude);
                    should.not.exist(b.longitude);
                    should.not.exist(b.line1);
                    should.not.exist(b.line2);
                    pot.traverse('locations', location.id, client.users[0].token, ['unpublish', 'edit'], function (err) {
                      if (err) {
                        return done(err);
                      }
                      d._ = {
                        visibility: {
                          'published': {
                            [groups.anonymous.id]: ['city', 'postal']
                          }
                        }
                      };
                      request({
                        uri: pot.resolve('apis', '/v/locations'),
                        method: 'POST',
                        json: d,
                        auth: {
                          bearer: client.users[0].token
                        }
                      }, function (e, r, location) {
                        if (e) {
                          return done(e);
                        }
                        r.statusCode.should.equal(201);
                        pot.publish('locations', location.id, client.users[0].token, client.admin.token, function (err) {
                          if (err) {
                            return done(err);
                          }
                          request({
                            uri: pot.resolve('apis', '/v/locations/' + location.id),
                            method: 'GET',
                            json: true
                          }, function (e, r, b) {
                            if (e) {
                              return done(e);
                            }
                            r.statusCode.should.equal(200);
                            should.exist(b);
                            should.exist(b.id);
                            should.exist(b.city);
                            should.exist(b.postal);
                            should.not.exist(b.name);
                            should.not.exist(b.latitude);
                            should.not.exist(b.longitude);
                            should.not.exist(b.line1);
                            should.not.exist(b.line2);
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
                              should.exist(b.id);
                              should.not.exist(b.city);
                              should.not.exist(b.postal);
                              should.not.exist(b.name);
                              should.not.exist(b.latitude);
                              should.not.exist(b.longitude);
                              should.not.exist(b.line1);
                              should.not.exist(b.line2);
                              done();
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});