/*global angular:true*/

angular
    .module('peersay')
    .config(config);

config.$inject = ['$routeProvider', '$locationProvider'];

function config($routeProvider, $locationProvider) {
    $routeProvider
        .when('/signup', {
            templateUrl: 'html/signup.html',
            controller: 'Auth',
            controllerAs: 'm'
        })
        .when('/login', {
            templateUrl: 'html/login.html',
            controller: 'Auth',
            controllerAs: 'm'
        })
        .when('/projects', {
            templateUrl: 'html/dashboard.html',
            controller: 'Peers',
            controllerAs: 'm'
        })
        .otherwise({
            redirectTo: '/login'
        });

    $locationProvider.html5Mode(true);
}
