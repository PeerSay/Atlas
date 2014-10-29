/*global angular:true*/

angular.module('peersay')
    .controller('AuthCtrl', AuthCtrl);


AuthCtrl.$inject = ['User', 'Location', '$http'];
function AuthCtrl(User, Location, $http) {
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
    m.logout = logout;
    m.restorePwd = restorePwd;
    m.restorePwdComplete = restorePwdComplete;


    showErrorFromQs();
    getUserFromQs();

    function logout () {
        User.logout()
            .success(function () {
                Location.path('/auth/login').replace();
            });
    }

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
                    Location.path('/auth/restore/complete').replace();
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
                    Location.path('/projects').replace();
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
        var qs = Location.search();
        var value = qs && qs[key];
        if (value) {
            // remove err from url, no history, no model reload
            Location
                .skipReload()
                .search(key, null)
                .replace();
        }
        return value;
    }
}
