'use strict';

var crypto = require('crypto');

module.exports = {
  loginFunction: function loginFunction() {
    throw 'diy-auth says: You must define a login function';
  },


  findDbSessionFunction: function findDbSessionFunction() {
    throw 'diy-auth says: You must define a findDbSession function';
  },

  saveSessionToDbFunction: function saveSessionToDbFunction() {
    throw 'diy-auth says: You must define a saveSessionToDB function';
  },

  clearSessionDbFunction: function clearSessionDbFunction() {
    throw 'diy-auth says: You must define a clearSessionDbFunction function';
  },

  saveCookieFunction: function (response, cookieName, cookieStoredData, expiredCookieTime, done) {
    response.cookie(cookieName, cookieStoredData, {
      expires: new Date(Date.now() + expiredCookieTime)
    });

    return done(null, true);
  },
  encrypt           : function encryptFunction(text, algorithm, password) {
    var cipher  = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  },

  decrypt: function decryptFunction(text, algorithm, password) {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec      = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
};
