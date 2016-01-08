'use strict';

var _       = require('lodash');
var Promise = require('bluebird');

module.exports = function (objectConf) {

  var start           = startFunction;
  var login           = loginFunction;
  var isAuthenticated = isAuthenticatedFunction;
  var logout          = logoutFunction;
  var getCookieData   = getCookieDataFunction;

  var objectConfiguration = {
    sessionData             : require('./to-do-functions').sessionData,
    findDbSession           : require('./to-do-functions').findDbSessionFunction,
    saveSessionToDb         : require('./to-do-functions').saveSessionToDbFunction,
    clearSessionDb          : require('./to-do-functions').clearSessionDbFunction,
    saveCookie              : require('./default-functions').saveCookieFunction,
    encrypt                 : require('./default-functions').encrypt,
    decrypt                 : require('./default-functions').decrypt,
    expiredCookieTime       : 1000 * 60 * 60 * 24 * 365,
    userTypes               : [],
    routes                  : [],
    password                : 'battle church pink better',
    algorithm               : 'aes-256-ctr',
    cookieName              : 'session',
    cookieRoleKeyName       : 'role',
    userNotFoundMessage     : 'User not found',
    passwordIncorrectMessage: 'Password incorrect',
    userLoggedMessage       : 'User logged correctly',
    cookieNotFoundMessage   : 'Session cookie not found',
    logoutMessage           : 'User logged out correctly',
    opthimist               : true
  };

  _.merge(objectConfiguration, objectConf);

  function createRequestAuthObject(req) {
    req.diyAuth = {
      authenticated  : false,
      hasPermission  : false,
      isAuthenticated: isAuthenticated,
      sessionData    : objectConfiguration.sessionData,
      saveCookie     : objectConfiguration.saveCookie,
      saveSessionToBd: objectConfiguration.saveSessionToBd,
      logout         : logout,
      getCookieData  : getCookieData
    };
  }


  // 1. login, el usuario se loguea
  // 2. se busca en la base de datos el usuario y contraseña
  //    2.1.  ocurre un error
  //    2.2.  no encuentra el usuario
  //    2.3.  la contraseña no coincide
  //    2.4.  el usuario y contraseña coinciden
  //        2.4.1.  Devuelve los datos que queramos tener en la sesion,
  //                normalmente el nombre del usuario, el tipo de usuario,
  //                datos de personalizaci�n, etc.

  function loginFunction(req, res, user, pass) {
    var sessionData;
    objectConfiguration.sessionData(user, pass)
      .then(function (data) {
        // obtenemos los datos a guardar en la sesion
        sessionData = data;
        return data.id;
      })
      .then(encrypt)
      .then(function (encryptedId) {
        // guardamos la cookie con la id encryptada
        objectConfiguration.saveCookie(res, objectConfiguration.cookieName,
          encryptedId, objectConfiguration.expiredCookieTime);

        return objectConfiguration.saveSessionToDb(sessionData);
      })
      .then(function () {
        createRequestAuthObject(req);
        req.diyAuth.authenticated = true;
        req.diyAuth.hasPermission = true;
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function encrypt(data) {
    return Promise.resolve(objectConfiguration.encrypt(
      data.id,
      objectConfiguration.algorithm,
      objectConfiguration.password));
  }

  function logoutFunction(req, res) {
    return new Promise(function (resolve, reject) {
      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {
        var cookieData = req.cookies[objectConfiguration.cookieName];

        res.clearCookie(objectConfiguration.cookieName);

        objectConfiguration.clearSessionDb(cookieData, function (err) {
          if (err) reject(err);

          resolve(objectConfiguration.logoutMessage);
        });
      }
    });
  }

  function startFunction() {
    return function start(req, res, next) {
      isAuthenticatedMiddelware(req, res, next);
    };
  }

  function isAuthenticatedMiddelware(req, res, next) {
    createRequestAuthObject(req);

    var route = req.body.url || req.originalUrl;

    if (requireAuth(route)) {

      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {
        // la cookie existe, la desencripto para sacar el id
        obtainCookieData(req.cookies[objectConfiguration.cookieName])
          .then(objectConfiguration.findDbSession)
          .then(function (doc) {
            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = !(objectConfiguration.userTypes.length > 0 && !hasAccess(doc.role, route));

            if (!(req.diyAuth.authenticated && req.diyAuth.hasPermission)) {
              res.status(403);
              res.send();
            }

            return next();
          })
          .catch(function (err) {
            return next(err);
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

  function obtainCookieData(cookieData) {
    return new Promise(function (resolve, reject) {
      var descryptedCookieData;
      try {
        descryptedCookieData = JSON.parse(objectConfiguration.decrypt(
          cookieData,
          objectConfiguration.algorithm,
          objectConfiguration.password));
      } catch (err) {
        reject(err);
      }
      resolve(descryptedCookieData);
    });
  }

  function requireAuth(route, method) {
    // TODO this function
  }

  function hasAccess(type, route) {
    // TODO this function
  }

};
