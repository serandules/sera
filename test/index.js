var nconf = require('nconf').argv().env();

nconf.defaults(require('../env/sera.json'));

var sera = require('../index');
var pot = require('pot');

var initializers = require('../initializers');
var server = require('./server');

before(function (done) {
  console.log('starting up the server');
  sera(function (err) {
    if (err) {
      return done(err);
    }
    pot.start(function (err) {
      if (err) {
        return done(err);
      }
      initializers.init(function (err) {
        if (err) {
          return done(err);
        }
        server.start(done);
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