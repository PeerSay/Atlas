/*global angular:true*/

angular.module('peersay')
    .controller('AuthCtrl', AuthCtrl)
    .factory('Location', Location);


AuthCtrl.$inject = ['Users', 'Location', '$http'];
function AuthCtrl(Users, location, $http) {
    var m = this;
    m.error = {
        show: false,
        msg: "Something is wrong"
    };
    m.errorLinkedIn = {
        show: false
    };
    m.user = {
        email: '',
        password: '',
        restore: ''
    };
    m.restorePwd = restorePwd;
    m.restorePwdComplete = restorePwdComplete;


    Users.setHeader(); // switch menu upon navigation
    showErrorFromQs();
    getUserFromQs();


    function restorePwd() {
        return $http.post('/api/auth/restore', {email: m.user.email})
            .success(function (res) {
                if (res.error) {
                    if (res.error === 'linkedin') {
                        m.error.show = false;
                        m.errorLinkedIn.show = true
                    }
                    else {
                        m.errorLinkedIn.show = false;
                        m.error.msg = res.error;
                        m.error.show = true;
                    }
                }
                else if (res.result) {
                    location.path('/auth/restore/complete').replace();
                }
            })
            .error(function (res) {
                console.log('TODO handle restore err: %O', res);
            })
    }

    function restorePwdComplete() {
        return $http.post('/api/auth/restore/complete', {
            code: m.user.restore,
            password: m.user.password
        })
            .success(function (res) {
                if (res.error) {
                    m.error.msg = res.error;
                    m.error.show = true;
                }
                else if (res.result) {
                    location.path('/user/1/projects').replace();
                }
            })
            .error(function (res) {
                console.log('TODO handle restore err: %O', res);
            })
    }


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
