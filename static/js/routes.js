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
        .when('/user/:id/projects', {
            templateUrl: '/html/project-list.html',
            controller: 'ProjectListCtrl',
            controllerAs: 'm'
        })
        .when('/user/:id/projects/:projectId', {
            templateUrl: '/html/project-details.html'
        })
        .otherwise({
            redirectTo: '/not-implemented'
        });

    $locationProvider.html5Mode(true);
}
