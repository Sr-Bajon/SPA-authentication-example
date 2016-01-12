'use strict';

var crypto  = require('crypto');
var Promise = require('bluebird');

module.exports = {
  saveCookieFunction: function (response, cookieName, cookieStoredData,
                                expiredCookieTime, done) {
    response.cookie(cookieName, cookieStoredData, {
      expires: new Date(Date.now() + expiredCookieTime)
    });

    return Promise.resolve(true);
  },

  encrypt: function encryptFunction(text, algorithm, password) {
    var cipher  = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');

    return Promise.resolve(crypted);
  },

  decrypt: function decryptFunction(text, algorithm, password) {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec      = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');

    return Promise.resolve(dec);
  }
};
