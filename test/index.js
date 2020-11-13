var server = require('./server');
var pot = require('pot');

before(function (done) {
  console.log('starting up the server');
  pot.start(function (err) {
    if (err) {
      return done(err);
    }
    server.start(done);
  });
});

after(function (done) {
  console.log('shutting down the server');
  pot.stop(function (destroyed) {
    server.stop(destroyed);
  }, done);
});