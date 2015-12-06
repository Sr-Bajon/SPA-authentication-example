'use strict';

angular.module('myApp', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/indice");

    $stateProvider
      .state('login', {
        url        : "/login",
        templateUrl: "views/login.html"
      })
      .state('principal', {
        url        : "/principal",
        templateUrl: "views/principal.html"
      })
      .state('admin', {
        url        : "/admin",
        templateUrl: "views/admin.html"
      })
      .state('indice', {
        url        : "/indice",
        templateUrl: "views/indice.html"
      });
  });
