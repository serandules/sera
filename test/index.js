var pot = require('pot');
var sera = require('sera');

var initializers = require('../initializers');
var server = require('./server');

before(function (done) {
  console.log('starting up the server');
  sera(function (err) {
    if (err) {
      return done(err);
    }
    pot.start(function (initialized) {
      initializers.init(function (err) {
        if (err) {
          return initialized(err);
        }
        server.start(initialized);
      });
    }, done);
  });
});

after(function (done) {
  console.log('shutting down the server');
  pot.stop(function (destroyed) {
    server.stop(destroyed);
  }, done);
});