var log = require('logger')('models:clients:service');

module.exports = function (done) {
  var service = {
    auth: {
      GET: [
        '^\/$',
        '^\/.*'
      ]
    },
    model: 'model-clients',
    createOne: true,
    findOne: true,
    replaceOne: true,
    removeOne: true
  };

  done(null, service);
};
