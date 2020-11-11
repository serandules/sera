var sera = require('../index');
var pot = require('pot');

var server = require('./server');


var userPlugins = function (model, done) {
  var validators = sera.validators;
  var types = validators.types;

  model.plugin(function (schema, options) {
    schema.add({
      name: {
        type: String,
        validator: types.name({
          length: 200
        })
      }
    });
  });

  done();
};

before(function (done) {
  console.log('starting up the server');
  sera(function (err) {
    if (err) {
      return done(err);
    }
    sera.extend({
      users: {
        plugins: userPlugins
      }
    }, function (err) {
      if (err) {
        return done(err);
      }
      pot.start(function (err) {
        if (err) {
          return done(err);
        }
        sera.boot([], function (err) {
          if (err) {
            return done(err);
          }
          server.start(done);
        });
      });
    });
  });
});

after(function (done) {
  console.log('shutting down the server');
  pot.stop(function (destroyed) {
    server.stop(destroyed);
  }, done);
});