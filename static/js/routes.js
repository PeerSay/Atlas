/*global angular:true*/

angular
    .module('peersay')
    .config(config);

config.$inject = ['$routeProvider', '$locationProvider'];

function config($routeProvider, $locationProvider) {
    $routeProvider
        .when('/signup', {
            templateUrl: '/html/signup.html',
            controller: 'AuthCtrl',
            controllerAs: 'm'
        })
        .when('/login', {
            templateUrl: '/html/login.html',
            controller: 'AuthCtrl',
            controllerAs: 'm'
        })
        .when('/projects', {
            templateUrl: '/html/project-list.html',
            controller: 'Projects', // TODO: proper Ctrl?
            controllerAs: 'm'
        })
        .when('/projects/:id', {
            templateUrl: '/html/project-details.html',
            controller: 'ProjectDetailsCtrl',
            controllerAs: 'm'
        })
        .otherwise({
            redirectTo: '/login'
        });

    $locationProvider.html5Mode(true);
}
