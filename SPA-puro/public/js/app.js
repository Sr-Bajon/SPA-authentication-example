angular.module('myApp', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {
    'use strict';

    $urlRouterProvider.otherwise('/indice');

    $stateProvider
      .state('login', {
        url        : '/login',
        templateUrl: 'views/login.html'
      })
      .state('principal', {
        url        : '/principal',
        templateUrl: 'views/principal.html'
      })
      .state('admin', {
        url        : '/admin',
        templateUrl: 'views/admin.html'
      })
      .state('indice', {
        url        : '/indice',
        templateUrl: 'views/indice.html'
      });
  })
  .controller('FormController', ['$http', function ($http) {
    'use strict';

    var formCtrl = this;

    formCtrl.formulario = {};

    formCtrl.submit = function () {
      $http.post('/login', {
        // passport espera que los datos sean "username" y "password", si se llaman
        // de otra forma, debemos indicarlo en la funcion de autenticacion, mirar
        // la documentacion de passport
        username: formCtrl.formulario.nombre,
        password: formCtrl.formulario.password
      }).then(function (success) {
        1 + 1;
      }, function (err) {
        1 + 1;
      });
    };


  }])
;
