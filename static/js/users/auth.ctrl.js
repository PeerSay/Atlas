/*global angular:true*/

angular.module('PeerSay')
    .controller('AuthCtrl', AuthCtrl);


AuthCtrl.$inject = ['Location', '$http', '$state'];
function AuthCtrl(Location, $http, $state) {
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
        restore: '',
        longSession: true
    };
    m.restorePwd = restorePwd;
    m.restorePwdComplete = restorePwdComplete;


    showErrorFromQs();
    getUserFromQs();

    // Restore
    function restorePwd() {
        return $http.post('/api/auth/restore', {email: m.user.email})
            .success(function (res) {
                if (res.error) {
                    if (res.error === 'linkedin') {
                        m.error.show = false;
                        m.errorLinkedIn.show = true;
                    }
                    else {
                        m.errorLinkedIn.show = false;
                        m.error.msg = res.error;
                        m.error.show = true;
                    }
                }
                else if (res.result) {
                    // Go to state and prevent Back
                    $state.transitionTo('auth.restore-complete', null, { location: 'replace' });
                }
            })
            .error(function (res) {
                console.log('TODO handle restore err: %O', res);
            });
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
                    // Go to state and prevent Back
                    $state.transitionTo('project.list', null, { location: 'replace' });
                }
            })
            .error(function (res) {
                console.log('TODO handle restore err: %O', res);
            });
    }


    // Util
    function showErrorFromQs() {
        var err = getValueFromQs('err');
        if (err) {
            m.error.msg = err;
            m.error.show = true;
        }
    }

    function getUserFromQs() {
        var email = getValueFromQs('email');
        if (email) {
            m.user.email = email;
        }
    }

    function getValueFromQs(key) {
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
