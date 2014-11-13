/*global angular:true*/

angular
    .module('peersay')
    .config(config);

config.$inject = ['$routeProvider', '$locationProvider'];

function config($routeProvider, $locationProvider) {
    $routeProvider
        // Auth
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
        .when('/auth/restore', {
            templateUrl: '/html/restore-pwd.html'
        })
        .when('/auth/restore/complete', {
            templateUrl: '/html/restore-pwd-complete.html'
        })

        // Projects
        .when('/projects', {
            templateUrl: '/html/project-list.html',
            controller: 'ProjectListCtrl',
            controllerAs: 'm'
        })
        .when('/projects/:projectId', {
            templateUrl: '/html/project-details.html',
            reloadOnSearch: false
        })
        .otherwise({
            redirectTo: '/not-implemented'
        });

    $locationProvider.html5Mode(true);
}
