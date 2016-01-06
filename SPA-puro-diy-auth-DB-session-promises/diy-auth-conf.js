'use strict';

var Promise = require('bluebird');

module.exports = function (db) {

  var login           = loginFunction;
  var clearSessionDb  = clearSessionDbFunction;
  var saveSessionToDb = saveSessionToDbFunction;
  var finDbdSession   = findDbSessionFunction;

  var userColeccion            = db.collection('spaPure');
  var sessionColeccion         = db.collection('spaPure-session');
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
  var noAuth                   = [
    {
      path  : '/',
      method: ['GET', 'POST']
    },
    {
      path  : '/favicon.ico',
      method: []
    },
    {
      path: '/login'
    },
    '/authenticate'];

  /*
   Propuesta de mejora:
   requerido - path          : un array de rutas, pueden ser expresiones regulares también.
   opcional  - method        : un array de metodos, las rutas serán validadas por ruta y metodo
   puede ser un array vacio en cuyo caso cualquier metodo pasa el test
   puede no aparecer method en cuyo caso cualquier metodo pasa el test
   opcional  - accessByRole  : un array con el nombre de los roles que tienen acceso a las rutas indicadas
   puede ser un array vacio o no aparecer en cuyo caso si auth es true se autentica contra el usuario actual sea del tipo que sea
   required  - auth          : boolean, indica si se debe autenticar o no la ruta
   true, la ruta se autentica contra el metodo y el rol del usuario
   false, la ruta no se autentica, es lo mismo que no poner o poner un array vacio en la clave accessByRole

   en el objeto de configuracion otra opcion que sea:
   opthimist:                : boolean
   true por defecto, si una ruta no esta definida en routes se le da acceso por defecto.
   false, si una ruta no esta definida en routes se le niega acceso por defecto.

   */
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

  function loginFunction(user, pass, done) {
    findUser(userColeccion, user, pass, function (err, doc) {
      if (err) done(err, null);

      done(null, createCookieData(doc._id.toString(), doc.role));
    });
  }

  function loginFunctionPromise(user, pass, done) {
    findUser(userColeccion, user, pass, function (err, doc) {
      if (err) done(err, null);

      done(null, createCookieData(doc._id.toString(), doc.role));
    });

    findUserPromise(user, pass).then();

  }



  function createCookieData(id, role) {
    return JSON.stringify({
      id  : id,
      role: role
    });
  }

  function findUser(colection, user, pass, done) {
    colection.findOne({user: user}, function (err, doc) {
      if (err) return done(503, null);

      if (doc === null) return done(userNotFoundMessage, null);

      if (doc.pass !== pass) return done(passwordIncorrectMessage, null);

      return done(null, doc);
    });
  }

  function findUserPromise(colection, user, pass) {
    return new Promise(function (resolve, reject) {
      colection.findOne({user: user}, function (err, doc) {
        if (err) return reject(503);

        if (doc === null) return reject(userNotFoundMessage);

        if (doc.pass !== pass) return reject(passwordIncorrectMessage);

        return resolve(doc);
      });
    });
  }

  function clearSessionDbFunction(id, done) {
    deleteOne(sessionColeccion, id, function (err, success) {
      if (err) done(err, null);

      return done(null, success);
    });
  }

  function deleteOne(colection, id, done) {
    colection.deleteOne({_id: id}, function (err) {
      if (err) return done(err, null);

      return done(null, true);
    });
  }

  function saveSessionToDbFunction(cookieStoredData, done) {
    insert(sessionColeccion, cookieStoredData, function (err, success) {
      if (err) return done(err, null);

      return done(null, success);
    });
  }

  function insert(colection, cookieStoredData, done) {
    colection.insert({_id: cookieStoredData},
      function (err, doc) {

        if (err && err.code === 11000) {
          // this is a duplicated id error code
          return done('Duplicated', null);
        }

        if (err) return done(err, null);

        return done(null, doc);
      });
  }

  function findDbSessionFunction(id, done) {
    findOneSessionDb(sessionColeccion, id, function (err, doc) {
      if (err) return done(err, null);

      return done(null, doc._id.toString());
    });
  }

  function findOneSessionDb(colection, id, done) {
    // buscar el valor de la cookie en la base de datos
    colection.findOne({_id: id}, function (err, doc) {
      if (err) return done(err, null);

      if (doc === null) return done('No doc found', null);

      return done(null, doc);
    });
  }

  return {
    login          : login,
    saveSessionToDb: saveSessionToDb,
    finDbdSession  : finDbdSession,
    clearSessionDb : clearSessionDb,
    userTypes      : userTypes,
    noAuth         : noAuth
  };
};
