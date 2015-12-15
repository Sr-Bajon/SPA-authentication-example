'use strict';

var async     = require('async');
var _         = require('lodash');
var crypto    = require('crypto'),
    algorithm = 'aes-256-ctr',
    password  = 'd6F3Efeq';

module.exports = function (objectConf) {
  var objectConfiguration = {
    login                   : function () {
      throw 'diy-auth says: You must define a login function';
    },
    saveCookie              : function () {
      throw 'diy-auth says: You must define a saveCookie function';
    },
    saveSessionToBd         : function () {
      throw 'diy-auth says: You must define a saveSessionToBD function';
    },
    isAuthenticated         : function () {
      throw 'diy-auth says: You must define a isAuthenticated function';
    },
    cookieName              : 'session',
    userNotFoundMessage     : 'User not found',
    passwordIncorrectMessage: 'Password incorrect',
    userTypes               : [],
    encrypt                 : function (text, done) {
      var cipher  = crypto.createCipher(algorithm, password);
      var crypted = cipher.update(text, 'utf8', 'hex');
      crypted += cipher.final('hex');
      return done(null, crypted);
    },
    decrypt                 : function (text, done) {
      var decipher = crypto.createDecipher(algorithm, password);
      var dec      = decipher.update(text, 'hex', 'utf8');
      dec += decipher.final('utf8');
      return done(null, dec);
    }
  };

  _.merge(objectConfiguration, objectConf);

  function start() {
    return function start(req, res, next) {
      objectConfiguration.isAuthenticated(req);
      console.log('hola dola');
      return next();
    };
  }

  function logerFunction(req, res) {
    async.waterfall([
      objectConfiguration.login(req, res, done),
      objectConfiguration.saveCookie(req, res, cookieStoredData, done),
      objectConfiguration.saveSessionToBd(req, res, cookieStoredData, done)
    ], function (err, req) {
      if (err) throw err;

      req.diyAuth = {
        isAutenticated: isAuthenticatedFunction(req),
        authenticated : true
      };
    });
  }

  return {
    start          : start,
    login          : objectConfiguration.login,
    saveCookie     : objectConfiguration.saveCookie,
    saveSessionToBd: objectConfiguration.saveSessionToBd,
    loger          : logerFunction
  };

};
