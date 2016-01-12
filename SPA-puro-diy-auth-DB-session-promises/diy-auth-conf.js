'use strict';

var Promise = require('bluebird');

module.exports = function (db) {

  var sessionData     = sessionDataFunction;
  var clearSessionDb  = clearSessionDbFunction;
  var saveSessionToDb = saveSessionToDbFunction;
  var finDbdSession   = findDbSessionFunction;

  var userColeccion            = db.collection('spaPure');
  var sessionColeccion         = db.collection('spaPure-session');
  var userNotFoundMessage      = 'User not found';
  var passwordIncorrectMessage = 'Password incorrect';

  var routes = [
    {
      path        : ['/login'],
      method      : ['GET', 'POST'],
      accessByRole: ['administrador', 'usuario', 'emergencia'],
      auth        : true
    },
    {
      path: ['/', '/favicon.ico', '/home', '/authenticate', '/loginUser',
        '/buscaEmail', '/insertUser', '/authenticate'],
      auth: false
    }
  ];

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
    return Promise.resolve(JSON.stringify({
      id  : doc.id.toString(),
      role: doc.role,
      date: Date.parse(new Date().toString())
    }));
  }


  function sessionDataFunction(user, pass) {
    return Promise.resolve(
      findUser(userColeccion, user, pass)
        .then(parseCookieData));
  }

  function saveSessionToDbFunction(sessionData) {
    return new Promise(function (resolve, reject) {
      sessionColeccion.insert({_id: sessionData.id},
        function (err, doc) {

          if (err && err.code === 11000) {
            // this is a duplicated id error code
            reject('Duplicated');
          }

          if (err) reject(err);

          return resolve(doc);
        });
    });
  }

  function clearSessionDbFunction(id) {
    return new Promise(function (resolve, reject) {
      sessionColeccion.deleteOne({_id: id}, function (err) {
        if (err) reject(err);

        resolve(true);
      });
    });
  }

  function findDbSessionFunction(id) {
    // buscar el valor de la cookie en la base de datos
    return new Promise(function (resolve, reject) {
      sessionColeccion.findOne({_id: id}, function (err, doc) {
        if (err) reject(err);

        if (doc === null) return reject('No doc found');

        return resolve(doc);
      });
    });
  }

  return {
    sessionData    : sessionData,
    saveSessionToDb: saveSessionToDb,
    finDbdSession  : finDbdSession,
    clearSessionDb : clearSessionDb,
    routes         : routes
  };


};
