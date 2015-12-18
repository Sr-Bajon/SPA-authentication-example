'use strict';

var _      = require('lodash');
var crypto = require('crypto');

module.exports = function (objectConf) {

  var start           = startFunction;
  var logger          = loggerFunction;
  var isAuthenticated = isAuthenticatedFunction;
  var logout          = logoutFunction;

  var objectConfiguration = {
    login                   : require('./to-do-functions').loginFunction,
    findDbSession           : require('./to-do-functions').findDbSessionFunction,
    saveSessionToDb         : require('./to-do-functions').saveSessionToDbFunction,
    clearSessionDb          : require('./to-do-functions').clearSessionDbFunction,
    saveCookie              : require('./default-functions').saveCookieFunction,
    encrypt                 : require('./default-functions').encrypt,
    decrypt                 : require('./default-functions').decrypt,
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
      isAuthenticatedMiddelware(req, res, next);
      return next();
    };
  }

  function requireAuth(route) {
    var result;
    objectConfiguration.noAuth.forEach(function (item) {
      result = item.match(route);
      if (result !== null && result[1] === 'route') {
        return true;
      }
    });
    return false;
  }

  function isAuthenticatedMiddelware(req, res, next) {
    createRequestAuthObject(req);

    if (!requireAuth(req.originalUrl)) {
      req.diyAuth.authenticated = false;
      req.diyAuth.hasPermission = false;

      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {

        objectConfiguration.findDbSession(req.cookies[objectConfiguration.cookieName],
          function (err) {
            if (err) return next(err);

            var descryptedCookieData;
            try {
              descryptedCookieData = JSON.parse(objectConfiguration.decrypt(
                req.cookies[objectConfiguration.cookieName],
                objectConfiguration.algorithm,
                objectConfiguration.password));
            } catch (err) {
              return next(err);
            }

            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = !(objectConfiguration.userTypes.length > 0 && !hasAccess(descryptedCookieData.type, req.originalUrl));

          });
      }

      if (!(req.diyAuth.authenticated && req.diyAuth.hasPermission)) {
        res.status(403);
        res.send();
      }
    } else {
      req.diyAuth.authenticated = true;
      req.diyAuth.hasPermission = true;
    }
  }

  function isAuthenticatedFunction(req, route, done) {
    createRequestAuthObject(req);

    if (!requireAuth(req.originalUrl)) {
      req.diyAuth.authenticated = false;
      req.diyAuth.hasPermission = false;

      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {

        objectConfiguration.findDbSession(req.cookies[objectConfiguration.cookieName],
          function (err) {
            if (err) return done(err, null);

            var descryptedCookieData;
            try {
              descryptedCookieData = JSON.parse(objectConfiguration.decrypt(
                req.cookies[objectConfiguration.cookieName],
                objectConfiguration.algorithm,
                objectConfiguration.password));
            } catch (err) {
              return done(err, null);
            }

            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = !(objectConfiguration.userTypes.length > 0 && !hasAccess(descryptedCookieData.type, route));

            return done(null, req.diyAuth.authenticated && req.diyAuth.hasPermission);
          });
      } else {
        return done(null, false);
      }
    } else {
      req.diyAuth.authenticated = true;
      req.diyAuth.hasPermission = true;
      return done(null, req.diyAuth.authenticated && req.diyAuth.hasPermission);
    }
  }

  function createRequestAuthObject(req) {
    req.diyAuth = {
      authenticated  : false,
      hasPermission  : false,
      isAuthenticated: isAuthenticated,
      login          : objectConfiguration.login,
      saveCookie     : objectConfiguration.saveCookie,
      saveSessionToBd: objectConfiguration.saveSessionToBd,
      logout         : logout
    };
  }

  function loggerFunction(req, res, user, pass, done) {

    objectConfiguration.login(user, pass, function (err, cookieStoredData) {
      if (err) return done(err, null);

      var encriptedCookieStoredData = objectConfiguration.encrypt(
        cookieStoredData,
        objectConfiguration.algorithm,
        objectConfiguration.password);

      objectConfiguration.saveCookie(res, objectConfiguration.cookieName,
        encriptedCookieStoredData, objectConfiguration.expiredCookieTime,
        function (err) {
          if (err) return done(err, null);

          objectConfiguration.saveSessionToDb(encriptedCookieStoredData, function (err) {
            if (err) return done(err, null);

            createRequestAuthObject(req);
            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = true;

            return done(null, objectConfiguration.userLoggedMessage);
          });
        }
      );
    });
  }

  function logoutFunction(req, res, done) {
    if (req.cookies && req.cookies[objectConfiguration.cookieName]) {
      var cookieData = req.cookies[objectConfiguration.cookieName];

      res.clearCookie(objectConfiguration.cookieName);

      objectConfiguration.clearSessionDb(cookieData, function (err) {
        if (err) return done(err, null);

        return done(null, objectConfiguration.logoutMessage);
      });
    }
  }

  function hasAccess(type, route) {
    var authorized = true;

    objectConfiguration.userTypes.forEach(function (item) {
      if (item.type === type) {
        item.hasNoAccess.forEach(function (noAccessPath) {
          if (noAccessPath === route) {
            authorized = false;
          }
        });
      }
    });
    return authorized;
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
