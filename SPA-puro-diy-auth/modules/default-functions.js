'use strict';

module.exports = {
  loginFunction: function loginFunction() {
    throw 'diy-auth says: You must define a login function';
  },

  saveCookieFunction: function saveCookieFunction() {
    throw 'diy-auth says: You must define a saveCookie function';
  },

  findDbSessionFunction: function findDbSessionFunction() {
    throw 'diy-auth says: You must define a findDbSession function';
  },

  saveSessionToDbFunction: function saveSessionToDbFunction() {
    throw 'diy-auth says: You must define a saveSessionToDB function';
  },

  deleteCookieFunction: function deleteCookieFunction() {
    throw 'diy-auth says: You must define a deleteCookie function';
  },

  clearSessionDbFunction: function clearSessionDbFunction() {
    throw 'diy-auth says: You must define a clearSessionDbFunction function';
  }
};
