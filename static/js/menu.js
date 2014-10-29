/*global angular:true*/

angular.module('peersay')
    .factory('Menu', Menu)
    .factory('Location', Location)
    .controller('MenuCtrl', MenuCtrl);


function Menu() {
    var M = {};
    M.activePage = {};
    M.setActivePage = function (value) {
        var stripped = value.replace(/\//g, '');
        M.activePage.name = stripped;
    };

    return M;
}


MenuCtrl.$inject = ['Location', 'Menu', 'User', 'Projects'];
function MenuCtrl(Location, Menu, User, Projects) {
    var m = this;
    m.activePage = Menu.activePage;
    m.user = {
        logout: logout
    };
    m.project = {
        toggleCreateDlg: Projects.toggleCreateDlg.bind(Projects)
    };

    function logout () {
        User.logout()
            .success(function () {
                Location.path('/auth/login').replace();
            });
    }

    //init menu
    Menu.setActivePage(Location.path());
}

// Credit: https://github.com/angular/angular.js/issues/1699
Location.$inject = ['$location', '$route', '$rootScope', 'Menu'];
function Location($location, $route, $rootScope, Menu) {

    $rootScope.$on('$locationChangeSuccess', function () {
        Menu.setActivePage($location.path());
    });

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