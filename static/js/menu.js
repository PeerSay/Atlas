/*global angular:true*/

angular.module('PeerSay')
    .factory('Location', Location)
    .controller('MenuCtrl', MenuCtrl);


MenuCtrl.$inject = ['Location', 'User', 'Projects'];
function MenuCtrl(Location, User, Projects) {
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
                Location.url('/auth/login')
                    .replace();
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