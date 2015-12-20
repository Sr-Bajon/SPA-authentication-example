'use strict';


module.exports = {
  loginFunction: function loginFunction() {
    throw 'diy-auth says: You must define a login function';
  },

  findDbSessionFunction: function findDbSessionFunction(cookie, done) {
    done(null);
  },

  saveSessionToDbFunction: function saveSessionToDbFunction(encriptedCookieStoredData, done) {
    done(null);
  },

  clearSessionDbFunction: function clearSessionDbFunction(cookieData, done) {
    done(null);
  }
};
