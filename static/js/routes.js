/*global angular:true*/

angular
    .module('PeerSay')
    .run(routesRun)
    .config(routesConfig);

routesRun.$inject = ['$rootScope', '$state', '$stateParams'];
function routesRun($rootScope, $state, $stateParams) {
    // To access them from any scope of app. For example for:
    // <li ng-class="{ active: $state.includes('auth') }">
    //
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}

routesConfig.$inject = ['$stateProvider', '$urlRouterProvider', '$locationProvider'];
function routesConfig($stateProvider, $urlRouterProvider, $locationProvider) {
    // Allows to use nicer '/some' urls instead of '#/some',
    // but has some caveats:
    // https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
    $locationProvider.html5Mode(true);

    $urlRouterProvider
        .otherwise('/auth/login'); //XXX?

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
            templateUrl: '/html/project-list.html',
            controller: 'ProjectListCtrl as m'
        })
        // Project > Details
        //
        .state('project.details', {
            url: '/projects/:projectId',
            templateUrl: '/html/project-details.html',
            controller: 'ProjectDetailsCtrl as cm',
            resolve: {
                Wizard: 'Wizard'
            },
            onEnter: ['$stateParams', 'Wizard', function($stateParams, Wizard){
                Wizard.load($stateParams.projectId);
            }]
        })
        // Project > Details > Steps
        //
        .state('project.details.steps', {
            url: '/step-{step}',
            views: {
                '': {
                    template: '<ui-view/>'
                },
                'step2': {
                    templateUrl: '/html/project-tile.html',
                    controller: 'ProjectRequirementsCtrl as cm'
                },
                'step3': {
                    templateUrl: '/html/project-tile.html',
                    controller: 'ProjectProductsCtrl as cm'
                },
                'step4': {
                    templateUrl: '/html/project-tile.html',
                    controller: 'ProjectShortlistCtrl as cm'
                }
            }
        })
        // Project > Details > Steps > Essentials
        //
        .state('project.details.steps.essentials', {
            url: '/essentials?edit={field}',
            templateUrl: '/html/project-essentials-edit.html',
            controller: 'ProjectEssentialsEditCtrl as cm'
        })
        // Project > Details > Steps > Requirements
        //
        .state('project.details.steps.requirements', {
            url: '/requirements',
            templateUrl: '/html/project-requirements-edit.html',
            controller: 'ProjectRequirementsEditCtrl as cm'
        })
        // Project > Details > Steps > Products
        //
        .state('project.details.steps.products', {
            url: '/products',
            templateUrl: '/html/project-products-edit.html',
            controller: 'ProjectProductsEditCtrl as cm'
        })
        // Project > Details > Steps > Decisions
        //
        .state('project.details.steps.shortlist', {
            url: '/shortlist',
            templateUrl: '/html/project-shortlist-edit.html',
            controller: 'ProjectShortlistEditCtrl as cm'
        });
}
