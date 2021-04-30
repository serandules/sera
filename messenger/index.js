var log = require('logger')('messenger');
var errors = require('errors');
var nconf = require('nconf');
var request = require('request');

var utils = require('../utils');

var smsGateway = 'https://sms.textware.lk:5001/sms/send_sms.php';

var smsUser = nconf.get('SMS_USERNAME');
var smsPass = nconf.get('SMS_PASSWORD');

var array = function (o) {
  if (!o) {
    return null;
  }
  return Array.isArray(o) ? o : [o];
};

exports.email = function (data, done) {
  if (utils.env() === 'test') {
    return done()
  }
  utils.ses().sendEmail({
    Destination: {
      BccAddresses: array(data.bcc),
      CcAddresses: array(data.cc),
      ToAddresses: array(data.to)
    },
    Message: {
      Body: {
        Html: {
          Data: data.html,
          Charset: 'UTF-8'
        },
        Text: {
          Data: data.text,
          Charset: 'UTF-8'
        }
      },
      Subject: {
        Data: data.subject,
        Charset: 'UTF-8'
      }
    },
    Source: data.from,
    ConfigurationSetName: null,
    ReplyToAddresses: array(data.reply),
    ReturnPath: null,
    ReturnPathArn: null,
    SourceArn: null,
    Tags: array(data.tags)
  }, function (err, data) {
    if (err) {
      return done(err);
    }
    done(null, data);
  });
};

exports.sms = function (data, done) {
  request({
    method: 'POST',
    uri: smsGateway,
    form: {
      username: smsUser,
      password: smsPass,
      src: data.sender,
      dst: data.phone,
      msg: data.message,
      dr: 1
    }
  }, function (e, r, b) {
    if (e) {
      log.error('sms:error', e);
      return done(errors.serverError());
    }
    if (r.statusCode !== 200) {
      log.error('sms:failure', b);
      return done(errors.serverError());
    }
    done();
  });
};
