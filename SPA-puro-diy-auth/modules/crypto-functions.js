'use strict';

var crypto = require('crypto');

module.exports = {
  encrypt: function encryptFunction(text, algorithm, password) {
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

