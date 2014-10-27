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
        email: '',
        password: ''
    };

    Users.setHeader(); // switch menu upon navigation
    showErrorFromQs();
    getUserFromQs();


    function showErrorFromQs() {
        var err = getValuefromQs('err');
        if (err) {
            m.error.msg = err;
            m.error.show = true;
        }
    }

    function getUserFromQs() {
        var email = getValuefromQs('email');
        if (email) {
            m.user.email = email;
        }
    }

    function getValuefromQs(key) {
        var qs = location.search();
        var value = qs && qs[key];
        if (value) {
            // remove err from url, no history, no model reload
            location
                .skipReload()
                .search(key, null)
                .replace();
        }
        return value;
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
