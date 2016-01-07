'use strict';

var _       = require('lodash');
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

  // 1. login, el usuario se loguea
  // 2. se busca en la base de datos el usuario y contraseña
  //    2.1.  ocurre un error
  //    2.2.  no encuentra el usuario
  //    2.3.  la contraseña no coincide
  //    2.4.  el usuario y contraseña coinciden
  //        2.4.1.  Devuelve los datos que queramos tener en la sesion,
  //                normalmente el nombre del usuario, el tipo de usuario,
  //                datos de personalización, etc.

  function findUser(colection, user, pass) {
    return new Promise(function (resolve, reject) {
      colection.findOne({user: user}, function (err, doc) {
        if (err) reject(503);

        if (doc === null) reject(userNotFoundMessage);

        if (doc.pass !== pass) reject(passwordIncorrectMessage);

        resolve(doc);
      });
    });
  }

  function parseCookieData(doc) {
    return new Promise(function (resolve, reject) {
      resolve(JSON.stringify({
        id  : doc.id.toString(),
        role: doc.role
      }));
    });
  }

  function cookieData(colection, user, pass){
    return new Promise(function(resolve, reject){
      findUser(colection, user, pass).then(parseCookieData(doc));
    });
  }

};
