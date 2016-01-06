'use strict';


module.exports = {
  // la funcion login debe buscar el usuario y contraseña en la base de datos y
  // devolver los datos que queramos que se guarden en la cookie, por ejemplo el
  // id y el role, si es un objeto devolverlo en forma JSON
  loginFunction: function loginFunction() {
    throw 'diy-auth says: You must define a login function';
  },

  // esta funcion recibe la id y un callback, y busca el id en la tabla o coleccion
  // donde hayamos guardado los datos de la sesion
  findDbSessionFunction: function findDbSessionFunction(id, done) {
    done(null);
  },

  // esta funcion recibe los datos que queramos guardar de la sesion, en general se
  // guardará el id de lo que se reciba, que serán los datos encriptados de la cookie
  saveSessionToDbFunction: function saveSessionToDbFunction(encriptedCookieStoredData, done) {
    done(null);
  },

  // recibe los datos de la cookie que coincidirán con el id de la tabla o coleccion
  // y la funcion borra los datos de la sesion de la base de datos.
  clearSessionDbFunction: function clearSessionDbFunction(cookieData, done) {
    done(null);
  }
};
