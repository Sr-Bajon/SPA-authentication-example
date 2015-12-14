'use strict';

var async = require('async');
var _     = require('lodash');

module.exports       = diyAuth;
module.exports.start = start;

var login,
    saveCookie,
    saveSessionToBd,
    isAuthenticated,
    cookieName,
    userNotFoundMessage,
    passwordIncorrectMessage,
    userTypes;

var objectConfiguration = {
  login                   : function () {
    throw 'diy-auth says: You must define a login function';
  },
  saveCookie              : function () {
    throw 'diy-auth says: You must define a saveCookie function';
  },
  saveSessionToBd         : function () {
    throw 'diy-auth says: You must define a saveSessionToBD function';
  },
  isAuthenticated         : function () {
    throw 'diy-auth says: You must define a isAuthenticated function';
  },
  cookieName              : 'session',
  userNotFoundMessage     : 'User not found',
  passwordIncorrectMessage: 'Password incorrect',
  userTypes               : []
};

function diyAuth(objectConf) {
  return function diyAuth(req, res, next) {
    _.merge(objectConfiguration, objectConf);
    1+1;
    return next();
  };
}

function start () {
  return function start(req, res, next){
    objectConfiguration.isAuthenticated();
    console.log('hola dola');
    return next();
  };
}

  //objectConfiguration.login(req, res, function (err, req, res, doc) {
  //  if (err) throw err;
  //
  //  console.log(doc);
  //});


function logerFunction(req, res) {
  async.waterfall([
    login(req, res, done),
    saveCookie(req, res, doc, done),
    saveSessionToBd(req, doc, cookieStoredData, done)
  ], function (err, req) {
    if (err) throw err;

    req.diyAuth = {
      isAutenticated: isAuthenticatedFunction(req),
      authenticated : true
    };
  });
}
