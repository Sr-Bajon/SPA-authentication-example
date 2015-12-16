angular.module('myApp', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {
    'use strict';

    $urlRouterProvider.otherwise('/indice');

    $stateProvider
      .state('login', {
        url         : '/login',
        templateUrl : 'views/login.html',
        authenticate: false
      })
      .state('principal', {
        url         : '/principal',
        templateUrl : 'views/principal.html',
        authenticate: true
      })
      .state('admin', {
        url         : '/admin',
        templateUrl : 'views/admin.html',
        authenticate: true
      })
      .state('indice', {
        url         : '/indice',
        templateUrl : 'views/indice.html',
        authenticate: false
      });
  })
  .run(['$rootScope', '$state', '$http', function ($rootScope, $state, $http) {
    'use strict';

    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
      if (toState.authenticate) {
        $http.post('/authenticate', {
          url: toState.url
        })
          .then(function (success) {
            console.log('authorized');
          },
          function (err) {
            event.preventDefault();
            $state.transitionTo('login');
          });
      }
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
