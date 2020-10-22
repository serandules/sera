var nconf = require('nconf');

nconf.overrides({
    "SERVICE_CONFIGS": "master:apis:/v/configs",
    "SERVICE_TOKENS": "master:apis:/v/tokens",
    "SERVICE_OTPS": "master:apis:/v/otps",
    "LOCAL_USERS": __dirname + "/..:apis:/v/users"
});

require('pot');
