var log = require('logger')('model-locations');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sera = require('../../index');
var plugins = require('../../plugins');
var validators = require('../../validators');
var utils = require('../../utils');

var types = validators.types;
var requires = validators.requires;

var schema = Schema({
  latitude: {
    type: Number,
    required: true,
    validator: types.number({
      max: 90,
      min: -90
    })
  },
  longitude: {
    type: Number,
    required: true,
    validator: types.number({
      max: 180,
      min: -180
    })
  },
  name: {
    type: String,
    validator: types.string({
      length: 200
    })
  },
  line1: {
    type: String,
    required: true,
    validator: types.string({
      length: 200
    })
  },
  line2: {
    type: String,
    validator: types.string({
      length: 200
    })
  },
  city: {
    type: String,
    required: true,
    validator: types.string({
      length: 100
    })
  },
  postal: {
    type: String,
    required: true,
    validator: types.string({
      length: 100
    })
  },
  district: {
    type: String,
    require: requires.district(),
    validator: types.string({
      length: 100
    })
  },
  province: {
    type: String,
    require: requires.province(),
    validator: types.string({
      length: 100
    })
  },
  state: {
    type: String,
    require: requires.state(),
    validator: types.string({
      length: 100
    })
  },
  country: {
    type: String,
    required: true,
    validator: types.country({
      allow: ['LK']
    })
  }
}, {collection: 'locations'});

schema.plugin(plugins());
schema.plugin(plugins.user());
schema.plugin(plugins._({
  workflow: 'model'
}));
schema.plugin(plugins.permissions({
  workflow: 'model'
}));
schema.plugin(plugins.status({
  workflow: 'model'
}));
schema.plugin(plugins.visibility({
  workflow: 'model'
}));
schema.plugin(plugins.createdAt());
schema.plugin(plugins.updatedAt());
schema.plugin(plugins.modifiedAt());

utils.ensureIndexes(schema, [
  {updatedAt: 1, _id: 1}
]);

schema.statics.tagger = {
  validator: ['postal', 'city', 'district', 'province', 'state', 'country'],
  value: function (field, location, done) {
    var Locations = sera.model('locations');

    var wrap = function (name) {
      return field + ':locations:' + name;
    };

    Locations.findOne({_id: location}, function (err, location) {
      if (err) {
        return done(err);
      }
      var tags = [];
      if (!location) {
        return done(null, tags);
      }
      if (location.postal) {
        tags.push({name: wrap('postal'), value: location.postal});
      }
      if (location.city) {
        tags.push({name: wrap('city'), value: location.city});
      }
      if (location.district) {
        tags.push({name: wrap('district'), value: location.district});
      }
      if (location.province) {
        tags.push({name: wrap('province'), value: location.province});
      }
      if (location.state) {
        tags.push({name: wrap('state'), value: location.state});
      }
      if (location.country) {
        tags.push({name: wrap('country'), value: location.country});
      }
      done(null, tags);
    });
  }
};

module.exports = mongoose.model('locations', schema);
