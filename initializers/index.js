var log = require('logger')('initializers');
var _ = require('lodash');
var async = require('async');
var fs = require('fs');

var sera = require('../index');

var zeroPad = function (name, length) {
    return (Array(length + 1).join('0') + name).slice(-length);
};

var sort = function (index, paths) {
    var maxLength = 0
    paths.forEach(function (path) {
        var length = path.indexOf('-');
        maxLength = length > maxLength ? length : maxLength;
    });
    var names = {};
    _.map(paths, function (path) {
        var length = path.length + maxLength - path.indexOf('-');
        names[zeroPad(path, length)] = path;
    });
    var run = [];
    Object.keys(names).sort().forEach(function (name) {
        var path = names[name];
        if (!index[path]) {
            run.push(path);
        }
    });
    return run;
};

exports.init = function (done) {
    sera.model('configs').findOne({name: 'initializers'}).exec(function (err, config) {
        if (err) {
            return done(err);
        }
        var initializers = config ? JSON.parse(config.value) : [];
        var index = {};
        initializers.forEach(function (initializer) {
            index[initializer] = true;
        });
        fs.readdir(__dirname + '/scripts', function (err, paths) {
            if (err) {
                return done(err);
            }
            var run = sort(index, paths);
            var ran = [];
            async.whilst(function () {
                return run.length;
            }, function (executed) {
                var path = run.shift();
                var initializer;
                try {
                    initializer = require('./scripts/' + path);
                } catch (e) {
                    return executed(e)
                }
                initializer(function (err) {
                    if (err) {
                        return executed(err);
                    }
                    ran.push(path);
                    executed();
                });
            }, function (err) {
                if (err) {
                    return done(err);
                }
                initializers = initializers.concat(ran);
                sera.model('configs').update({name: 'initializers'}, {value: JSON.stringify(initializers)}, {upsert: true}, done);
            });
        });
    });
};
