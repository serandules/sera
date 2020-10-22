var log = require('logger')('model-clients');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var mongoosePlugins = require('../../plugins/mongoose');
var validators = require('../../validators');

var types = validators.types;

var SECRET_LENGTH = 48;

var schema = Schema({
    secret: {type: String},
    name: {
        type: String,
        required: true,
        validator: types.string({
            length: 20
        })
    },
    description: {
        type: String,
        validator: types.string({
            length: 1000
        })
    },
    to: {
        type: [String],
        validator: types.array({
            max: 5,
            validator: types.url({
                field: 'to[*]'
            })
        })
    }
}, {collection: 'clients'});

schema.plugin(mongoosePlugins());
schema.plugin(mongoosePlugins.user());
schema.plugin(mongoosePlugins._({
    workflow: 'model-clients'
}));
schema.plugin(mongoosePlugins.permissions({
    workflow: 'model-clients'
}));
schema.plugin(mongoosePlugins.status({
    workflow: 'model-clients'
}));
schema.plugin(mongoosePlugins.visibility({
    workflow: 'model-clients'
}));
schema.plugin(mongoosePlugins.createdAt());
schema.plugin(mongoosePlugins.updatedAt());
schema.plugin(mongoosePlugins.modifiedAt());

schema.methods.verify = function (secret) {
    return this.secret === secret;
};

schema.methods.refresh = function (cb) {
    var that = this;
    crypto.randomBytes(SECRET_LENGTH, function (err, buf) {
        if (err) {
            log.error('clients:refresh', err);
            cb(err);
            return;
        }
        that.secret = buf.toString('hex');
        cb();
    });
};

schema.pre('save', function (next) {
    this.refresh(function (err) {
        next(err);
    });
});

/*
 user.statics.find = function (options, callback) {
 if (options.email) {
 this.findOne({
 email: email
 }, callback);
 return;
 }
 callback(null);
 };*/

module.exports = mongoose.model('clients', schema);
