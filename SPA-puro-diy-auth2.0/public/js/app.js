angular.module('myApp', ['ui.router'])
  .config(function ($provide) {
    'use strict';
    $provide.decorator('$state', function ($delegate, $rootScope) {
      $rootScope.$on('$stateChangeStart', function (event, state, params) {
        $delegate.next     = state;
        $delegate.toParams = params;
      });
      return $delegate;
    });
  })

  .config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
      'use strict';

      $urlRouterProvider.otherwise('/indice');

      $stateProvider
        .state('login', {
          url        : '/login',
          templateUrl: 'views/login.html'
        })
        .state('principal', {
          url        : '/principal',
          templateUrl: 'views/principal.html',
          resolve    : {authenticate: 'AuthService'}
        })
        .state('admin', {
          url        : '/admin',
          templateUrl: 'views/admin.html',
          resolve    : {authenticate: 'AuthService'}
        })
        .state('indice', {
          url        : '/indice',
          templateUrl: 'views/indice.html'
        });
    }])

  .run(['$rootScope', '$state', function ($rootScope, $state) {
    'use strict';

    $rootScope.$on('$stateChangeError',
      function (event, toState, toParams, fromState, fromParams, error) {
        event.preventDefault();
        //$state.transitionTo('login');
        $state.go('login');
      });
  }])

  .factory('AuthService', ['$http', '$state', function ($http, $state) {
    'use strict';
    console.log('hasta aqui');
    return $http.post('/authenticate', {
      url: $state.next.url
    });
  }])

  .controller('FormController', ['$http', function ($http) {
    'use strict';

    var formCtrl = this;

    formCtrl.formulario = {};

    formCtrl.submit = function () {
      $http.post('/login', {
        username: formCtrl.formulario.nombre,
        password: formCtrl.formulario.password
      }).then(function (success) {
        1 + 1;
      }, function (err) {
        1 + 1;
      });
    };


  }])

  .controller('IndiceController', ['$http', function ($http) {
    'use strict';

    var indiceCtrl = this;

    indiceCtrl.logout = function () {
      $http.post('/logout')
        .then(function (success) {
          1 + 1;
        }, function (err) {
          1 + 1;
        });
    };

  }])
;
