/*global angular:true*/

angular.module('PeerSay')
    .factory('Location', Location)
    .controller('MenuCtrl', MenuCtrl);


MenuCtrl.$inject = ['$state', 'User', 'Projects'];
function MenuCtrl($state, User, Projects) {
    var m = this;
    m.user = {
        logout: logout
    };
    m.project = {
        toggleCreateDlg: Projects.toggleCreateDlg.bind(Projects)
    };

    function logout () {
        User.logout()
            .success(function () {
                // Go to state and prevent Back
                $state.transitionTo('auth.login', null, { location: 'replace' });
            });
    }
}

// Credit: https://github.com/angular/angular.js/issues/1699
Location.$inject = ['$location', '$route', '$rootScope'];
function Location($location, $route, $rootScope) {

    /*$rootScope.$on('$locationChangeSuccess', function () {
        Menu.setActivePage($location.path());
    });*/

    $location.skipReload = function () {
        var lastRoute = $route.current;
        var un = $rootScope.$on('$locationChangeSuccess', function () {
            $route.current = lastRoute;
            un();
        });
        return $location;
    };

    return $location;
}