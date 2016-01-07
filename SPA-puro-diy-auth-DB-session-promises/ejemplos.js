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

  concatena().then(function (data) {
    console.log(data);
  });


  function promesaConcatenable() {
    return new Promise(function (resolve) {
      var x = 2 + 2;
      resolve(x);
    });
  }

  function promesaContenable2(data) {
    return new Promise(function (resolve) {
      console.log(data + 4);
      resolve(data + 4);
    });
  }

  promesaConcatenable().then(suma);
  promesaConcatenable().then(suma(33));
  promesaConcatenable().then(promiseAll);


  function suma(dato){
    console.log(dato);
  }

  function promiseAll(data){
    return Promise.all([promesaContenable2(data), promesaContenable2(data), promesaContenable2(data)]);
  }

})();


