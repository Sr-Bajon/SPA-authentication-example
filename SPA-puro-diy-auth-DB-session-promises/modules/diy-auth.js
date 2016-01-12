'use strict';

var _       = require('lodash');
var Promise = require('bluebird');

module.exports = function (objectConf) {

  var getCookieData   = getCookieDataFunction;
  var isAuthenticated = isAuthenticatedFunction;
  var login           = loginFunction;
  var logout          = logoutFunction;
  var start           = startFunction;

  function getCookieDataFunction(req) {
    return new Promise(function (resolve, reject) {
      var descryptedCookieData = obtainCookieData(req.cookies[objectConfiguration.cookieName]);
      if (descryptedCookieData instanceof Error) {
        reject(Error.toString());
      }
      resolve(descryptedCookieData);
    });
  }

  function isAuthenticatedFunction(req, res) {
    return new Promise(function (resolve, reject) {
      createRequestAuthObject(req);

      var route  = req.body.url || req.originalUrl;
      var method = req.method;

      var authObj = requireAuth(route, method);

      if (authObj.auth) {

        if (req.cookies && req.cookies[objectConfiguration.cookieName]) {
          // la cookie existe, la desencripto para sacar el id
          obtainCookieData(req.cookies[objectConfiguration.cookieName])
            .then(objectConfiguration.findDbSession)
            .then(function (doc) {
              req.diyAuth.authenticated = true;
              req.diyAuth.hasPermission = authObj.accessByRole.indexOf(doc.role) !== -1;

              if (req.diyAuth.authenticated && req.diyAuth.hasPermission) {
                resolve(true);
              } else {
                reject(true);
              }
            })
            .catch(function (err) {
              reject(err);
            });
        } else {
          res.status(403);
          res.send();
        }
      } else {
        req.diyAuth.authenticated = true;
        req.diyAuth.hasPermission = true;
        resolve(true);
      }
    });
  }

  function loginFunction(req, res, user, pass) {
    // 1. login, el usuario se loguea
    // 2. se busca en la base de datos el usuario y contraseña
    //    2.1.  ocurre un error
    //    2.2.  no encuentra el usuario
    //    2.3.  la contraseña no coincide
    //    2.4.  el usuario y contraseña coinciden
    //        2.4.1.  Devuelve los datos que queramos tener en la sesion,
    //                normalmente el nombre del usuario, el tipo de usuario,
    //                datos de personalización, etc.
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

  var objectConfiguration = {
    sessionData             : require('./to-do-functions').sessionData,
    findDbSession           : require('./to-do-functions').findDbSessionFunction,
    saveSessionToDb         : require('./to-do-functions').saveSessionToDbFunction,
    clearSessionDb          : require('./to-do-functions').clearSessionDbFunction,
    saveCookie              : require('./default-functions').saveCookieFunction,
    encrypt                 : require('./default-functions').encrypt,
    decrypt                 : require('./default-functions').decrypt,
    expiredCookieTime       : 1000 * 60 * 60 * 24 * 365,
    /*
     routes
       requerido - path          : un array de rutas, pueden ser expresiones regulares también.
       opcional  - method        : un array de metodos, las rutas serán validadas por ruta y metodo
         puede ser un array vacio en cuyo caso cualquier metodo pasa el test
         puede no aparecer method en cuyo caso cualquier metodo pasa el test
       opcional  - accessByRole  : un array con el nombre de los roles que tienen acceso a las rutas indicadas
         puede ser un array vacio o no aparecer en cuyo caso si auth es true se autentica contra el usuario actual sea del tipo que sea
       required  - auth          : boolean, indica si se debe autenticar o no la ruta
         true, la ruta se autentica contra el metodo y el rol del usuario
        false, la ruta no se autentica, es lo mismo que no poner o poner un array vacio en la clave accessByRole
    */
    routes                  : [],
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

  function encrypt(data) {
    return Promise.resolve(objectConfiguration.encrypt(
      data.id,
      objectConfiguration.algorithm,
      objectConfiguration.password));
  }

  function isAuthenticatedMiddelware(req, res, next) {
    createRequestAuthObject(req);

    var route  = req.body.url || req.originalUrl;
    var method = req.method;

    var authObj = requireAuth(route, method);

    if (authObj.auth) {

      if (req.cookies && req.cookies[objectConfiguration.cookieName]) {
        // la cookie existe, la desencripto para sacar el id
        obtainCookieData(req.cookies[objectConfiguration.cookieName])
          .then(objectConfiguration.findDbSession)
          .then(function (doc) {
            req.diyAuth.authenticated = true;
            req.diyAuth.hasPermission = authObj.accessByRole.indexOf(doc.role) !== -1;

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

  function testRoute(routeTest, route) {
    var testOk = false;
    if (Object.prototype.toString.call(routeTest) === '[object RegExp]') {
      if (routeTest.test(route)) {
        testOk = true;
      }
    } else if (routeTest.toLowerCase() === route.toLowerCase()) {
      testOk = true;
    }

    return testOk;
  }

  function testMethod(methodArray, method) {
    var methodOK = false;
    method       = method.toLowerCase();
    methodArray.forEach(function (methodItem) {
      if (methodItem.toLowerCase() === method) {
        methodOK = true;
      }
    });

    return methodOK;
  }

  function recorrerRouteObj(routeObj, route, method) {
    var rutaPasa     = false;
    var methodPasa   = false;
    var auth         = false;
    var accessByRole = [];
    routeObj.path.forEach(function (path) {

      rutaPasa = testRoute(path, route);

      if (rutaPasa) {
        if (routeObj.method || routeObj.method.length === 0) {
          methodPasa = true;
        } else {
          methodPasa = testMethod(routeObj.method, method);
        }
      }

      if (rutaPasa && methodPasa) {
        // se ha encontrado la ruta y el metodo (ya sea la ruta una expresión
        // regular o el metodo no este contemplado)
        auth = routeObj.auth;
        if (routeObj.accessByRole && routeObj.accessByRole.length > 0) {
          accessByRole = routeObj.accessByRole;
        }
      }
    });

    return {auth: auth, accessByRole: accessByRole};
  }

  function requireAuth(route, method) {
    // comprueba si la ruta y el metodo requieren autenticacion
    var authObj = {auth: false, accessByRole: []};
    objectConfiguration.routes.forEach(function (routeObj) {
      authObj = recorrerRouteObj(routeObj, route, method);
    });

    return authObj;
  }

  return {
    getCookieData  : getCookieData,
    isAuthenticated: isAuthenticated,
    login          : login,
    saveCookie     : objectConfiguration.saveCookie,
    saveSessionToBd: objectConfiguration.saveSessionToBd,
    sessionData    : objectConfiguration.sessionData,
    start          : start
  };

};
