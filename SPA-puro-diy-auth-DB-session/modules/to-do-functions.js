'use strict';


module.exports = {
  loginFunction: function loginFunction() {
    throw 'diy-auth says: You must define a login function';
  },

  findDbSessionFunction: function findDbSessionFunction(done) {
    done(null);
  },

  saveSessionToDbFunction: function saveSessionToDbFunction(done) {
    done(null);
  },

  clearSessionDbFunction: function clearSessionDbFunction(done) {
    done(null);
  }
};
