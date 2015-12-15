'use strict';
var async = require('async');

module.exports = function (db) {

  var login           = loginFunction;
  var clearSessionDb  = clearSessionDbFunction;
  var saveCookie      = saveCookieFunction;
  var saveSessionToDb = saveSessionToDbFunction;
  var finDbdSession   = findDbSessionFunction;

  var coleccion                = db.collection('spaPure');
  var sessionColeccion         = db.collection('spaPure-session');
  var cookieName               = 'session';
  var userNotFoundMessage      = 'User not found';
  var passwordIncorrectMessage = 'Password incorrect';
  var userTypes                = [
    {
      type       : 'admin',
      hasNoAccess: []
    },
    {
      type       : 'user',
      hasNoAccess: ['/admin']
    }
  ];


  function loginFunction(req, res, done) {
    // suponiendo que el user sea identificador unico, que deberia
    coleccion.findOne({user: req.body.username}, function (err, doc) {
      if (err) return done(503, req, res, null);

      if (doc === null) return done(userNotFoundMessage, req, res, null);

      if (doc.pass !== req.body.password) return done(passwordIncorrectMessage, req, res, null);

      var cookieStoredData = JSON.stringify({
        id  : doc._id.toString(),
        type: doc.type
      });

      return done(null, req, res, cookieStoredData);
    });
  }

  function clearSessionDbFunction(id, done) {
    sessionColeccion.deleteOne({_id: id}, function (err, doc) {
      if (err) return done(err, null);

      return done(null, true);
    });
  }

  function saveCookieFunction(req, res, cookieStoredData, expiredCookieTime, done) {
    res.cookie(cookieName, cookieStoredData, {
      expires: new Date(Date.now() + expiredCookieTime)
    });

    return done(null, req, res, cookieStoredData);
  }

  function saveSessionToDbFunction(req, res, cookieStoredData, done) {
    sessionColeccion.insert({_id: cookieStoredData},
      function (err, doc) {

        if (err && err.code === 11000) {
          // this is a duplicated id error code
          return done(null, req, res);
        }

        if (err) return done(err, req, res);

        return done(null, req, res);
      });
  }

  function findDbSessionFunction(req, cookieName, done) {
    // buscar el valor de la cookie en la base de datos
    sessionColeccion.findOne({_id: req.cookies[cookieName]}, function (err, doc) {
      if (err) return done(err, null);

      if (doc === null) return done('No doc found', null);

      // encontrado en la bd
      // mirar si tiene permiso para la ruta actual
      return done(null, doc._id.toString());
    });
  }

  return {
    login          : login,
    saveCookie     : saveCookie,
    saveSessionToDb: saveSessionToDb,
    finDbdSession  : finDbdSession,
    userTypes      : userTypes,
    clearSessionDb : clearSessionDb
  };
};
