'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

module.exports = function (objectConf) {

  var start           = startFunction;
  var logger          = loggerFunction;
  var isAuthenticated = isAuthenticatedFunction;
  var logout          = logoutFunction;
  var getCookieData   = getCookieDataFunction;

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
    cookieRoleKeyName       : 'role',
    userNotFoundMessage     : 'User not found',
    passwordIncorrectMessage: 'Password incorrect',
    userLoggedMessage       : 'User logged correctly',
    cookieNotFoundMessage   : 'Session cookie not found',
    logoutMessage           : 'User logged out correctly'
  };

  _.merge(objectConfiguration, objectConf);

  function createRequestAuthObject(req) {
    req.diyAuth = {
      authenticated  : false,
      hasPermission  : false,
      isAuthenticated: isAuthenticated,
      login          : objectConfiguration.login,
      saveCookie     : objectConfiguration.saveCookie,
      saveSessionToBd: objectConfiguration.saveSessionToBd,
      logout         : logout,
      getCookieData  : getCookieData
    };
  }

  function startFunction() {
    return function start(req, res, next) {
      isAuthenticatedMiddelware(req, res, next);
    };
  }

  function requireAuth(route, method) {
    method           = method || null;
    var requiredAuth = true;

    if (objectConfiguration.noAuth.length !== 0) {
      objectConfiguration.noAuth.forEach(function (item) {
        // es un string o un objeto?
        if (Object.prototype.toString.call(item) === '[object String]') {
          // es un string
          if (compararCadenas(item, route)) {
            requiredAuth = false;
          }
        } else {
          // es un objeto
          if (compararCadenas(item.path, route)) {
            // la ruta coincide, ahora miramos si coincide el metodo
            if (method && item.method) {
              // si method es distinto de null y existe la clave method en el objeto
              item.method.forEach(function (subItem) {
                if (compararCadenas(subItem, method)) {
                  requiredAuth = false;
                }
              });
            } else {
              // si no existe el metodo, con que hayamos validado la ruta nos vale
              requiredAuth = false;
            }
          }
        }
      });
    }

    return requiredAuth;
  }

  function compararCadenas(ruta1, ruta2) {
    ruta1       = ruta1.toLowerCase();
    ruta2       = ruta2.toLowerCase();
    var result  = ruta1.match(ruta2);
    var retorno = false;
    if (result !== null && result[0] === ruta1) {
      retorno = true;
    }
    return retorno;
  }

  function isAuthenticatedMiddelware(req, res, next) {
    createRequestAuthObject(req);

    var route = req.body.url || req.originalUrl;

    if (requireAuth(route)) {

      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {

        objectConfiguration.findDbSession(req.cookies[objectConfiguration.cookieName],
          function (err) {
            if (err) return next(err);

            var descryptedCookieData = obtainCookieData(req.cookies[objectConfiguration.cookieName]);
            if (descryptedCookieData instanceof Error) {
              next(Error.toString());
            }

            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = !(objectConfiguration.userTypes.length > 0 && !hasAccess(descryptedCookieData[objectConfiguration.cookieRoleKeyName],
              route));

            if (!(req.diyAuth.authenticated && req.diyAuth.hasPermission)) {
              res.status(403);
              res.send();
            }

            return next();
          });
      } else {
        res.status(403);
        res.send();
      }
    } else {
      req.diyAuth.authenticated = true;
      req.diyAuth.hasPermission = true;
      return next();
    }
  }

  function getCookieDataFunction(req) {
    var descryptedCookieData = obtainCookieData(req.cookies[objectConfiguration.cookieName]);
    if (descryptedCookieData instanceof Error) {
      return Error.toString();
    }
    return descryptedCookieData;
  }

  function obtainCookieData(cookieData) {
    var descryptedCookieData;
    try {
      descryptedCookieData = JSON.parse(objectConfiguration.decrypt(
        cookieData,
        objectConfiguration.algorithm,
        objectConfiguration.password));
    } catch (err) {
      return Error(err);
    }
    return descryptedCookieData;
  }

  function isAuthenticatedFunction(req, route, done) {
    createRequestAuthObject(req);

    if (requireAuth(req.body.url)) {

      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {

        objectConfiguration.findDbSession(req.cookies[objectConfiguration.cookieName],
          function (err) {
            if (err) return done(err, null);

            var descryptedCookieData = obtainCookieData(req.cookies[objectConfiguration.cookieName]);
            if (descryptedCookieData instanceof Error) {
              return done(Error.toString(), null);
            }

            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = !(objectConfiguration.userTypes.length > 0 && !hasAccess(descryptedCookieData[objectConfiguration.cookieRoleKeyName],
              route));

            return done(null, req.diyAuth.authenticated && req.diyAuth.hasPermission);
          });
      } else {
        return done(null, false);
      }
    } else {
      req.diyAuth.authenticated = true;
      req.diyAuth.hasPermission = true;
      return done(null, true);
    }
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
    isAuthenticated: isAuthenticated,
    getCookieData  : getCookieData
  };
};
