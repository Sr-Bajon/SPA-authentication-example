(function () {
  'use strict';
  var Promise = require('bluebird');

  function miPromesa() {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve('Pues mira que bien');
      }, 2000);
    });
  }

  function miOtraPromesa(dato) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve(dato + ' lo hago');
      }, 2000);
    });
  }

  function concatena() {
    return new Promise.resolve(miPromesa().then(miOtraPromesa));
  }

  concatena().then(function(data){
    console.log(data);
  });

})();


