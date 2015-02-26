/*global angular:true*/

angular.module('PeerSay')
    .controller('AuthCtrl', AuthCtrl);


AuthCtrl.$inject = ['Location', '$http', '$state', '$window', 'User'];
function AuthCtrl(Location, $http, $state, $window, User) {
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
    m.controlFormSubmit = '';
    m.login = login;
    m.restorePwd = restorePwd;
    m.restorePwdComplete = restorePwdComplete;


    showErrorFromQs();
    getUserFromQs();

    // Login
    function login() {
        var data = {
            email: m.user.email,
            password: m.user.password,
            longSession: !!m.user.longSession
        };

        m.controlFormSubmit = 'lock';

        return User.login(data)
            .then(function (res) {
                if (res.error === 'verify-email') {
                    // User is registered, but email address is not verified yet;
                    // email was sent now =>  show account activation screen (page reload!)
                    redirect('/auth/signup/success?email=' + m.user.email);
                }
                else if (res.error) {
                    m.error.msg = res.error;
                    m.error.show = true;
                    m.controlFormSubmit = 'unlock';
                }
                else if (res.result) {
                    // Submit login form normally (with page reload) via directive.
                    // This is to trigger browser save password dialog, see this:
                    // http://stackoverflow.com/questions/2382329/how-can-i-get-browser-to-prompt-to-save-password
                    m.controlFormSubmit = 'submit';
                }
            });
    }

    function redirect(url) {
        $window.location.href = url;
    }

    // Restore
    function restorePwd() {
        var data = {email: m.user.email};
        return $http.post('/api/auth/restore', data)
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
                    $state.go('auth.restore-complete', null, {location: 'replace'});
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
                    $state.go('project.list', null, {location: 'replace'});
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
