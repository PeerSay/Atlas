/*global angular:true*/

angular
    .module('PeerSay')
    .run(routesRun)
    .config(routesConfig);

routesRun.$inject = ['$rootScope', '$state', '$stateParams', '$location', '$window'];
function routesRun($rootScope, $state, $stateParams, $location, $window) {
    // To access them from any scope of app. For example for:
    // <li ng-class="{ active: $state.includes('auth') }">
    //
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    // GoogleAnalytics
    //
    $rootScope.$on('$stateChangeSuccess', function (event, toState) {
        if (!$window.ga) { return; }

        $window.ga('send', 'pageview', {page: $location.path(), title: toState.name});
    });
}

routesConfig.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];
function routesConfig($stateProvider, $urlRouterProvider, $locationProvider) {
    // Allows to use nicer '/some' urls instead of '#/some',
    // but has some caveats:
    // https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
    $locationProvider.html5Mode(true);

    $urlRouterProvider
        .otherwise('/auth/login');

    $stateProvider
        // Auth
        //
        .state('auth', {
            // Cannot be explicitly activated, activated implicitly on children activation
            abstract: true,
            // Will prepend '/auth' onto the urls of all its children.
            url: '/auth',
            views: {
                '': {
                    template: '<ui-view/>'
                },
                'menu@': {
                    templateUrl: '/html/app-menu.html'
                }
            }
        })
        // Auth > Login
        //
        .state('auth.login', {
            url: '/login',
            templateUrl: '/html/auth-login.html'
        })
        // Auth > Signup
        //
        .state('auth.signup', {
            url: '/signup',
            templateUrl: '/html/auth-signup.html'
        })
        .state('auth.signup-success', {
            url: '/signup/success',
            templateUrl: '/html/auth-signup-success.html'
        })
        .state('auth.signup-verified', {
            url: '/signup/verified',
            templateUrl: '/html/auth-signup-verified.html'
        })
        // Auth > Restore
        //
        .state('auth.restore', {
            url: '/restore',
            templateUrl: '/html/auth-restore.html'
        })
        .state('auth.restore-complete', {
            url: '/restore/complete',
            templateUrl: '/html/auth-restore-complete.html'
        })

        // Project
        //
        .state('project', {
            abstract: true,
            url: '',
            views: {
                '': {
                    template: '<ui-view/>'
                },
                'menu@': {
                    templateUrl: '/html/app-menu.html'
                }
            }
        })
        // Project > List
        //
        .state('project.list', {
            url: '/projects',
            templateUrl: '/html/project-list.html'
        })
        // Project > Details
        //
        .state('project.details', {
            url: '/projects/:projectId',
            templateUrl: '/html/project-details.html'
        })
        // Project > Details > Dashboard
        //
        .state('project.details.dashboard', {
            url: '/dashboard',
            templateUrl: '/html/project-dashboard.html'
        })
        // Project > Details > Decisions
        //
        .state('project.details.decisions', {
            url: '/decisions',
            templateUrl: '/html/project-decisions.html'
        })
        // Project > Details > Notes
        //
        .state('project.details.notes', {
            url: '/notes',
            templateUrl: '/html/project-notes.html'
        })
        // Project > Details > Essentials
        //
        .state('project.details.essentials', {
            url: '/essentials?edit={field}',
            templateUrl: '/html/project-essentials.html'
        })
        // Project > Details > Requirements
        //
        .state('project.details.requirements', {
            url: '/requirements',
            templateUrl: '/html/project-requirements.html'
        })
        // Project > Details > Products
        //
        .state('project.details.products', {
            url: '/products',
            templateUrl: '/html/project-products.html'
        });
}
