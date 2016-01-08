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

  var userTypes = [
    {
      type       : 'admin',
      hasNoAccess: []
    },
    {
      type       : 'user',
      hasNoAccess: ['/admin']
    }
  ];

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

};
