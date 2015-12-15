'use strict';
var async = require('async');

module.exports = function (db) {

  var login           = loginFunction;
  var saveCookie      = saveCookieFunction;
  var saveSessionToBd = saveSessionToBdFunction;
  var isAuthenticated = isAuthenticatedFunction;

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
    },
    {
      type       : 'default',
      hasNoAccess: ['/admin']
    }
  ];


  function loginFunction(req, res, done) {
    // suponiendo que el user sea identificador unico, que deberia
    coleccion.findOne({user: req.body.username}, function (err, doc) {
      if (err) return done(503, null);

      if (doc === null) return done(userNotFoundMessage, null);

      if (doc.pass !== req.body.password) return done(passwordIncorrectMessage, null);

      var cookieStoredData = JSON.stringify({
        id  : doc._id.toString(),
        type: doc.type
      });

      return done(null, req, res, cookieStoredData);
    });
  }

  function saveCookieFunction(req, res, cookieStoredData, done) {
    var time = 1000 * 60 * 60 * 24 * 365;

    res.cookie(cookieName, cookieStoredData, {
      expires: new Date(Date.now() + time)
    }).send();

    return done(null, req, res, cookieStoredData);
  }

  function saveSessionToBdFunction(req, res, cookieStoredData, done) {
    sessionColeccion.insert({_id: cookieStoredData},
      function (err, doc) {
        if (err) return done(err, null);

        return done(null, req, res);
      });
  }

  function isAuthenticatedFunction(req, res) {
    // ¿esta la cookie?
    // es un array, si es una sola cookie es un array tb?,
    if (req.cookies && req.cookies !== {} && req.cookies[cookieName]) {
      // buscar el valor de la cookie en la base de datos
      sessionColeccion.findOne({_id: req.cookies.value}, function (err, doc) {
        if (err) throw err;

        // encontrado en la bd
        // mirar si tiene permiso para la ruta actual
      });
    }
  }

  return {
    login          : login,
    isAuthenticated: isAuthenticated,
    saveCookie     : saveCookie,
    saveSessionToBd: saveSessionToBd
  };


};

