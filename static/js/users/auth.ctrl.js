/*global angular:true*/

angular.module('PeerSay')
    .controller('AuthCtrl', AuthCtrl);


AuthCtrl.$inject = ['$state', '$stateParams', '$window', 'User'];
function AuthCtrl($state, $stateParams, $window, User) {
    var m = this;
    m.error = {
        show: false,
        msg: "Something is wrong",
        hide: hideError
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
    m.formSubmitControl = '';
    m.login = login;
    m.signup = signup;
    m.restorePwd = restorePwd;
    m.restorePwdComplete = restorePwdComplete;


    activate();

    function activate() {
        showErrorFromQs();
        getEmailFromQs();
    }

    // Login
    function login() {
        var data = {
            email: m.user.email,
            password: m.user.password,
            longSession: !!m.user.longSession
        };

        m.formSubmitControl = 'lock';

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
                    m.formSubmitControl = 'unlock';
                }
                else if (res.result) {
                    // Submit login form normally (with page reload) via directive.
                    // This is to trigger browser save password dialog, see this:
                    // http://stackoverflow.com/questions/2382329/how-can-i-get-browser-to-prompt-to-save-password
                    m.formSubmitControl = 'submit';
                }
            });
    }

    //Signup
    function signup () {
        var data = {
            email: m.user.email,
            password: m.user.password
        };

        m.formSubmitControl = 'lock';

        return User.signup(data)
            .then(function (res) {
                if (res.error === 'verify-email') {
                    redirect('/auth/signup/success?email=' + m.user.email);
                }
                else if (res.error === 'duplicate') {
                    m.error.msg = 'User already registered with email: ' + m.user.email;
                    m.error.show = true;
                    m.formSubmitControl = 'unlock';
                }
                else if (res.error) {
                    m.error.msg = res.error;
                    m.error.show = true;
                    m.formSubmitControl = 'unlock';
                }
                else if (res.result) {
                    m.formSubmitControl = 'submit';
                }
            });
    }

    // Restore
    function restorePwd() {
        var data = { email: m.user.email };

        return User.restorePwd(data)
            .then(function (res) {
                if (res.error === 'linkedin') {
                    m.error.show = false;
                    m.errorLinkedIn.show = true;
                }
                else if (res.error) {
                    m.errorLinkedIn.show = false;
                    m.error.msg = res.error;
                    m.error.show = true;
                }
                else if (res.result) {
                    // Go to state and prevent Back
                    $state.go('auth.restore-complete', null, {location: 'replace'});
                }
            });
    }

    function restorePwdComplete() {
        var data = {
            code: m.user.restore,
            password: m.user.password
        };

        return User.restorePwdComplete(data)
            .then(function (res) {
                if (res.error) {
                    m.error.msg = res.error;
                    m.error.show = true;
                }
                else if (res.result) {
                    // Go to state and prevent Back
                    $state.go('project.list', null, {location: 'replace'});

                    // TODO - this is failed so far, because Chrome shows password save dialog with
                    // restore code (instead of email), which is not helpful..
                    // Submit login form to trigger browser save password dialog
                    //m.formSubmitControl = 'submit';
                }
            });
    }


    // Util
    function redirect(url) {
        $window.location.href = url;
    }

    function showErrorFromQs() {
        var err = $stateParams['err'];
        if (err) {
            m.error.msg = err;
            m.error.show = true;
        }
    }

    function getEmailFromQs() {
        var email = $stateParams['email'];
        if (email) {
            m.user.email = email;
        }
    }

    function hideError() {
        m.error.show = false;
        $state.go('.', null, {location: 'replace', inherit: false});
    }
}
