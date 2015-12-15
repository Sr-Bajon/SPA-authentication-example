'use strict';

var _ = require('lodash');

module.exports = function (objectConf) {

  var start           = startFunction;
  var logger          = loggerFunction;
  var isAuthenticated = isAuthenticatedFunction;

  var objectConfiguration = {
    login                   : require('./default-functions').loginFunction,
    saveCookie              : require('./default-functions').saveCookieFunction,
    findDbSession           : require('./default-functions').findDbSessionFunction,
    saveSessionToDb         : require('./default-functions').saveSessionToDbFunction,
    clearSessionDB          : require('./default-functions').clearSessionDbFunction,
    encrypt                 : require('./crypto-functions').encrypt,
    decrypt                 : require('./crypto-functions').decrypt,
    expiredCookieTime       : 1000 * 60 * 60 * 24 * 365,
    userTypes               : [],
    noAuth                  : [],
    password                : 'battle church pink better',
    algorithm               : 'aes-256-ctr',
    cookieName              : 'session',
    userNotFoundMessage     : 'User not found',
    passwordIncorrectMessage: 'Password incorrect',
    userLoggedMessage       : 'User logged correctly',
    cookieNotFoundMessage   : 'Session cookie not found',
    logoutMessage           : 'User logged out correctly'
  };

  _.merge(objectConfiguration, objectConf);

  function startFunction() {
    return function start(req, res, next) {
      isAuthenticated(req);
      return next();
    };
  }

  function createRequestAuthObject(req) {
    req.diyAuth = {
      authenticated  : false,
      hasPermission  : false,
      isAuthenticated: objectConfiguration.isAuthenticated,
      login          : objectConfiguration.login,
      saveCookie     : objectConfiguration.saveCookie,
      saveSessionToBd: objectConfiguration.saveSessionToBd,
      logout         : logout
    };
  }

  function loggerFunction(req, res, done) {
    objectConfiguration.login(req, res,
      function (err, req, res, cookieStoredData) {
        if (err) return done(err, req, res, null);

        var encriptedCookieStoredData = objectConfiguration.encrypt(
          cookieStoredData,
          objectConfiguration.algorithm,
          objectConfiguration.password);

        objectConfiguration.saveCookie(req, res, encriptedCookieStoredData,
          objectConfiguration.expiredCookieTime,
          function (err, req, res, encriptedCookieStoredData) {
            if (err) return done(err, req, res, null);

            objectConfiguration.saveSessionToDb(req, res, encriptedCookieStoredData,
              function (err, req, res) {
                if (err) return done(err, req, res, null);

                createRequestAuthObject(req);
                req.diyAuth.authenticated = true;
                req.diyAuth.hasPermission = true;

                return done(null, req, res, objectConfiguration.userLoggedMessage);
              });
          }
        );
      });
  }

  function logout(req) {
    if (req.cookie && req.cookie[objectConfiguration.cookieName]) {
      var cookieData = req.cookie(objectConfiguration.cookieName);

      req.clearCookie(objectConfiguration.cookieName);

      objectConfiguration.clearSessionDB(cookieData, function (err, done) {
        if (err) return done(err, null);

        return done(null, objectConfiguration.logoutMessage);
      });
    }
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

  function isAuthenticatedFunction(req, done) {
    createRequestAuthObject(req);
    if (req.cookies && req.cookies !== {} && req.cookies[objectConfiguration.cookieName]) {

      objectConfiguration.findDbSession(req, objectConfiguration.cookieName,
        function (err, cookieData) {
          if (err) return err;

          var descryptedCookieData;
          try {
            descryptedCookieData = JSON.parse(objectConfiguration.decrypt(
              cookieData,
              objectConfiguration.algorithm,
              objectConfiguration.password));
          } catch (err) {
            return err;
          }
          // en este punto se ha encontrado la cookie y el documento coincidente en la BD
          // comprobar si tiene permisos para acceder a la pagina.

          req.diyAuth.authenticated = true;
          req.diyAuth.hasPermission = objectConfiguration.userTypes.length > 0 &&
            hasAccess(descryptedCookieData.type, req.originalUrl);
        });
    }
  }

  return {
    start          : start,
    login          : objectConfiguration.login,
    saveCookie     : objectConfiguration.saveCookie,
    saveSessionToBd: objectConfiguration.saveSessionToBd,
    logger         : logger,
    isAuthenticated: isAuthenticated
  };
};
