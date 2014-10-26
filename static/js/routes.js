/*global angular:true*/

angular
    .module('peersay')
    .config(config);

config.$inject = ['$routeProvider', '$locationProvider'];

function config($routeProvider, $locationProvider) {
    $routeProvider
        .when('/auth/signup', {
            templateUrl: '/html/signup.html'
        })
        .when('/auth/signup/success', {
            templateUrl: '/html/signup-success.html'
        })
        .when('/auth/signup/verified', {
            templateUrl: '/html/signup-verified.html'
        })
        .when('/auth/login', {
            templateUrl: '/html/login.html'
        })
        .when('/projects', {
            templateUrl: '/html/project-list.html'
        })
        .when('/projects/:id', {
            templateUrl: '/html/project-details.html'
        })
        .otherwise({
            redirectTo: '/not-implemented'
        });

    $locationProvider.html5Mode(true);
}
