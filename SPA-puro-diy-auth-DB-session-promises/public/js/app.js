angular.module('myApp', ['ui.router'])

  .config(function ($provide) {
    'use strict';

    // decora $state para esté disponible en el resolve el parametro next y toParams para conocer
    // hacia que ruta se dirige la transición.
    // http://stackoverflow.com/questions/22985988/angular-ui-router-get-state-info-of-tostate-in-resolve
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
          resolve    : {authenticate: authFunction}
        })
        .state('admin', {
          url        : '/admin',
          templateUrl: 'views/admin.html',
          resolve    : {authenticate: authFunction}
        })
        .state('indice', {
          url        : '/indice',
          templateUrl: 'views/indice.html'
        });

      function authFunction($http, $state) {
        return $http.post('/authenticate', {
          url: $state.next.url
        });
      }

    }])

  .run(['$rootScope', '$state', function ($rootScope, $state) {
    'use strict';

    $rootScope.$on('$stateChangeError',
      function (event, toState, toParams, fromState, fromParams, error) {
        event.preventDefault();
        $state.go('login');
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
        formCtrl.loggued = true;
      }, function (err) {
        formCtrl.loggued = false;
      });
    };
  }])

  .controller('IndiceController', ['$http', function ($http) {
    'use strict';

    var indiceCtrl = this;

    indiceCtrl.logout = function () {
      $http.post('/logout')
        .then(function (success) {
          indiceCtrl.loggedOut = true;
        }, function (err) {
          indiceCtrl.loggedOut = false;
        });
    };

  }])

  .controller('AdminController', ['$http', function ($http) {
    'use strict';

    var adminCtrl = this;

    function showAdminData() {
      $http.post('/adminData')
        .then(function (success) {
          adminCtrl.adminData = success.data;
        }, function (err) {
          adminCtrl.adminData = 'You don\'t have access to this site';
        });
    }

    showAdminData();

  }])
;
