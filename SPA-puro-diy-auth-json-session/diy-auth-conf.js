'use strict';

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

  function loginFunction(user, pass, done) {
    findUser(userColeccion, user, pass, function (err, doc) {
      if (err) done(err, null);

      done(null, createCookieData(doc._id.toString(), doc.type));
    });
  }

  function createCookieData(id, type) {
    return JSON.stringify({
      id  : id,
      type: type
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
    userTypes      : userTypes,
    clearSessionDb : clearSessionDb
  };
};
