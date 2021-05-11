var util = require('util');
var errors = require('errors');

var format = function () {
  return util.format.apply(util.format, Array.prototype.slice.call(arguments));
};

var unprocessableEntity = function () {
  var message = format.apply(format, Array.prototype.slice.call(arguments));
  return errors.unprocessableEntity(message);
};

var models = [
  'binaries',
  'brands',
  'clients',
  'configs',
  'contacts',
  'grants',
  'groups',
  'otps',
  'locations',
  'menus',
  'messages',
  'models',
  'pages',
  'realestates',
  'taxonomies',
  'tiers',
  'tokens',
  'users',
  'vehicles',
  'workflows'
];

exports.validator = function (o, tags, done) {
  var tag;
  var length = tags.length;

  for (var i = 0; i < length; i++) {
    tag = tags[i];

    if (tag.group !== 'models') {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.group'))
    }

    if (tag.name !== 'model') {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.name'))
    }

    if (models.indexOf(tag.value) === -1) {
      return done(unprocessableEntity('\'%s\' contains an invalid value', o.field + '.value'))
    }
  }
  done();
};

exports.value = function (o, tags, done) {
  done();
};