var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var plugins = require('../../plugins');
var validators = require('../../validators');
var utils = require('../../utils');

var types = validators.types;
var values = validators.values;

var schema = Schema({
  password: {
    type: String,
    required: true,
    encrypted: true,
    validator: types.password({
      block: function (o, done) {
        var email = o.data.email || (o.user && o.user.email);
        var username = o.data.username || (o.user && o.user.username);
        var blocked = {};
        if (email) {
          blocked.email = email;
        }
        if (username) {
          blocked.username = username;
        }
        done(null, blocked);
      }
    })
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validator: types.email(),
    searchable: true
  },
  groups: {
    type: [Schema.Types.ObjectId],
    ref: 'groups',
    validator: types.groups(),
    value: values.groups()
  },
  username: {
    type: String,
    unique: true,
    required: true,
    validator: types.username({
      length: 50
    }),
    searchable: true
  }
}, {collection: 'users'});

schema.plugin(plugins({
  transform: function (o) {
    delete o.password;
  }
}));
schema.plugin(plugins._({
  workflow: 'model-users'
}));
schema.plugin(plugins.status({
  workflow: 'model-users'
}));
schema.plugin(plugins.permissions({
  workflow: 'model-users'
}));
schema.plugin(plugins.visibility({
  workflow: 'model-users'
}));
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt());

utils.ensureIndexes(schema, [
  {updatedAt: -1, _id: -1}
]);

schema.statics.auth = function (user, password, done) {
  utils.compare(password, user.password, done);
};

module.exports = mongoose.model('users', schema);
