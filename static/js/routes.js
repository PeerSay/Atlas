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

    $rootScope.$on('$stateChangeSuccess', function (event, toState/*, toParams*/) {
        //console.log('>> $stateChangeSuccess to=%O, params=%O', toState, toParams);

        // GoogleAnalytics
        //
        if ($window.ga) {
            $window.ga('send', 'pageview', {page: $location.path(), title: toState.name});
        }
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
            url: '/login?err',
            templateUrl: '/html/auth-login.html'
        })
        // Auth > Signup
        //
        .state('auth.signup', {
            url: '/signup?err',
            templateUrl: '/html/auth-signup.html'
        })
        .state('auth.signup-success', {
            url: '/signup/success?email',
            templateUrl: '/html/auth-signup-success.html'
        })
        .state('auth.signup-verified', {
            url: '/signup/verified?err',
            templateUrl: '/html/auth-signup-verified.html'
        })
        // Auth > Restore
        //
        .state('auth.restore', {
            url: '/restore?err',
            templateUrl: '/html/auth-restore.html'
        })
        .state('auth.restore-complete', {
            url: '/restore/complete?err',
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
            templateUrl: '/html/project-list.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details
        //
        .state('project.details', {
            url: '/projects/:projectId',
            templateUrl: '/html/project-details.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details > Dashboard
        //
        .state('project.details.dashboard', {
            url: '/dashboard',
            templateUrl: '/html/project-dashboard.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details > Decisions
        //
        .state('project.details.decisions', {
            url: '/decisions',
            templateUrl: '/html/project-decisions.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details > Notes
        //
        .state('project.details.notes', {
            url: '/notes',
            templateUrl: '/html/project-notes.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details > Requirements
        //
        .state('project.details.requirements', {
            url: '/requirements',
            templateUrl: '/html/project-requirements.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details > Products
        //
        .state('project.details.products', {
            url: '/products',
            templateUrl: '/html/project-products.html',
            resolve: {auth: ensureAuthorized}
        })
        // Project > Details > Presentations
        //
        .state('project.details.presentations', {
            url: '/presentations',
            templateUrl: '/html/project-presentations.html',
            resolve: {auth: ensureAuthorized}
        });
}

ensureAuthorized.$inject = ['User'];
function ensureAuthorized(User) {
    return User.isAuthorized();
}
