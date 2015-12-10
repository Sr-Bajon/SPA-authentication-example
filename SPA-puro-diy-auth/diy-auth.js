'use strict';
var async = require('async');

module.exports = function (db) {

  var coleccion        = db.collection('spaPure');
  var sessionColeccion = db.collection('spaPure-session');
  var userTypes        = [
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

  var login           = loginFunction;
  var saveCookie      = saveCookieFunction;
  var saveSessionToBd = saveSessionToBdFunction;
  var logged          = loggedFunction;

  function loginFunction(req, res, done) {
    // suponiendo que el user sea identificador unico, que deberia
    coleccion.find({user: req.body.user}, function (err, doc) {
      if (err) return done(503, null);

      if (doc === null) return done('User not found', null);

      if (doc.pass !== req.body.pass) return done('Password incorrect', null);

      return done(null, req, res, doc);
    });
  }

  function saveCookieFunction(req, res, doc, done) {
    var cookieStoredData = doc.id;
    var time             = 1000 * 60 * 60 * 24 * 365;

    res.cookie('session', cookieStoredData, {
      expires: new Date(Date.now() + time)
    });

    return done(null, req, doc, cookieStoredData);
  }

  function saveSessionToBdFunction(req, doc, cookieStoredData, done) {
    sessionColeccion.insert({_id: cookieStoredData, type: doc.type},
      function (err, doc) {
        if (err) return done(err, null);

        return done(null, req);
      });
  }

  function loggedFunction(req, res) {
    async.waterfall([
      login(req, res, done),
      saveCookie(req, res, doc, done),
      saveSessionToBd(req, doc, cookieStoredData, done)
    ], function (err, req) {
      if (err) throw err;

      req.diyAuth = {
        authenticated: true
      };

    });

  }


};

