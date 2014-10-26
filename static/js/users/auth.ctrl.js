/*global angular:true*/

angular.module('peersay')
    .controller('AuthCtrl', AuthCtrl)
    .factory('Location', Location);


AuthCtrl.$inject = ['Users', 'Location'];
function AuthCtrl(Users, location) {
    var m = this;
    m.error = {
        show: false,
        msg: "Something is wrong"
    };
    m.user = {
        email: 'a@a',
        password: '123123'
    };

    Users.setHeader(); // switch menu upon navigation
    showErrorFromQs();


    function showErrorFromQs() {
        var qs = location.search();
        var err = qs && qs.err;
        if (err) {
            m.error.msg = err;
            m.error.show = true;

            // remove err from url, no history, no model reload
            location
                .skipReload()
                .search('err', null)
                .replace();
        }
    }
}


// Credit: https://github.com/angular/angular.js/issues/1699
Location.$inject = ['$location', '$route', '$rootScope'];
function Location($location, $route, $rootScope) {
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
