var log = require('logger')('service-configs');

var find = require('./find');

module.exports = function (done) {
  find(function (err, configs) {
    if (err) {
      return done(err);
    }
    var allowed = ['^\/$'];
    configs.forEach(function (config) {
      allowed.push('^\/' + config.id + '$');
    });

    var service = {
      auth: {
        GET: allowed
      },
      findOne: true,
      find: true,
      createOne: true,
      updateOne: true,
      replaceOne: true
    };

    done(null, service);
  });
};