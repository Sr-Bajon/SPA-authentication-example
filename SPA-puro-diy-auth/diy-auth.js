'use strict';

var async  = require('async');
var _      = require('lodash');
var crypto = require('crypto');

module.exports = function (objectConf) {
  var objectConfiguration = {
    login                   : loginFunction,
    saveCookie              : saveCookieFunction,
    saveSessionToDb         : saveSessionToDbFunction,
    findDbSession           : findDbSessionFunction,
    deleteCookie            : deleteCookieFunction,
    password                : 'battle church pink better',
    algorithm               : 'aes-256-ctr',
    cookieName              : 'session',
    userNotFoundMessage     : 'User not found',
    passwordIncorrectMessage: 'Password incorrect',
    userLoggedMessage       : 'User logged correctly',
    cookieNotFoundMessage   : 'Session cookie not found',
    expiredCookieTime       : 1000 * 60 * 60 * 24 * 365,
    userTypes               : [],
    encrypt                 : encryptFunction,
    decrypt                 : decryptFunction
  };

  _.merge(objectConfiguration, objectConf);

  function start() {
    return function start(req, res, next) {
      isAuthenticated(req);
      return next();
    };
  }

  function loggerFunction(req, res, done) {
    objectConfiguration.login(req, res,
      function (err, req, res, cookieStoredData) {
        if (err) done(err, null);

        var encriptedCookieStoredData = objectConfiguration.encrypt(cookieStoredData);

        objectConfiguration.saveCookie(req, res, encriptedCookieStoredData,
          objectConfiguration.expiredCookieTime,
          function (err, req, res, encriptedCookieStoredData) {
            if (err) done(err, null);

            objectConfiguration.saveSessionToDb(req, res, encriptedCookieStoredData,
              function (err, req, res) {
                if (err) done(err, null);

                createRequestAuthObject(req);
                req.diyAuth.authenticated = true;
                req.diyAuth.hasPermission = true;

                return done(null, req, res, objectConfiguration.userLoggedMessage);
              });
          }
        )
        ;
      });
  }

  function createRequestAuthObject(req) {
    req.diyAuth = {
      authenticated  : false,
      hasPermission  : false,
      isAuthenticated: objectConfiguration.isAuthenticated,
      login          : objectConfiguration.login,
      saveCookie     : objectConfiguration.saveCookie,
      saveSessionToBd: objectConfiguration.saveSessionToBd
    };
  }

  function loginFunction() {
    throw 'diy-auth says: You must define a login function';
  }

  function saveCookieFunction() {
    throw 'diy-auth says: You must define a saveCookie function';
  }

  function findDbSessionFunction() {
    throw 'diy-auth says: You must define a findDbSession function';
  }

  function saveSessionToDbFunction() {
    throw 'diy-auth says: You must define a saveSessionToDB function';
  }

  function deleteCookieFunction() {
    throw 'diy-auth says: You must define a deleteCookie function';
  }

  function hasAccess(type, path) {
    var authorized = true;

    objectConfiguration.userTypes.forEach(function (item) {
      if (item.type === type) {
        item.hasNoAccess.forEach(function (noAccessPath) {
          if (noAccessPath === path) {
            authorized = false;
          }
        });
      }
    });
    return authorized;
  }

  function isAuthenticated(req, done) {
    createRequestAuthObject(req);
    if (req.cookies && req.cookies !== {} && req.cookies[objectConfiguration.cookieName]) {

      objectConfiguration.findDbSession(req, objectConfiguration.cookieName,
        function (err, cookieData) {
          if (err) done(err, null);

          var descryptedCookieData = JSON.parse(objectConfiguration.decrypt(cookieData));
          // en este punto se ha encontrado la cookie y el documento coincidente en la BD
          // comprobar si tiene permisos para acceder a la pagina.

          req.diyAuth.authenticated = true;
          req.diyAuth.hasPermission = objectConfiguration.userTypes.length > 0 &&
            hasAccess(descryptedCookieData.type, req.originalUrl);
        });
    }
  }

  function encryptFunction(text) {
    var cipher  = crypto.createCipher(objectConfiguration.algorithm,
      objectConfiguration.password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }

  function decryptFunction(text) {
    var decipher = crypto.createDecipher(objectConfiguration.algorithm,
      objectConfiguration.password);
    var dec      = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  return {
    start          : start,
    login          : objectConfiguration.login,
    saveCookie     : objectConfiguration.saveCookie,
    saveSessionToBd: objectConfiguration.saveSessionToBd,
    logger         : loggerFunction,
    isAuthenticated: isAuthenticated
  };
};
