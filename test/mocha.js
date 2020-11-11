var nconf = require('nconf').argv().env();

nconf.defaults(require('../env/sera.json'));