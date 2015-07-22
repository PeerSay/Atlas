/*global angular:true*/

angular.module('PeerSay')
    .controller('AuthCtrl', AuthCtrl);


AuthCtrl.$inject = ['$q', '$state', '$stateParams', '$window', 'User', 'Notify', 'Util'];
function AuthCtrl($q, $state, $stateParams, $window, User, Notify, _) {
    var m = this;
    // Form data
    m.user = {
        email: '',
        password: '',
        restore: '',
        longSession: true
    };
    m.formSubmitControl = '';
    // API calls
    m.login = login;
    m.signup = signup;
    m.restorePwd = restorePwd;
    m.restorePwdComplete = restorePwdComplete;
    // Error notifications
    m.notify = Notify;


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
                    m.notify.show('warn', {title: 'Error', text: res.error});
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
                    m.notify.show('warn', {title: 'Error', text: 'User already registered with email: ' + m.user.email});
                    m.formSubmitControl = 'unlock';
                }
                else if (res.error) {
                    m.notify.show('warn', {title: 'Error', text: res.error});
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
                    m.notify.show('linkedin', {title: 'Hey!', text: 'You are registered with LinkedIn.'});
                }
                else if (res.error) {
                    m.notify.show('warn', {title: 'Error', text: res.error});
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
                    m.notify.show('warn', {title: 'Error', text: res.error});
                }
                else if (res.result) {
                    // Go to state and prevent Back
                    $state.go('project.list', null, {location: 'replace'});

                    // TODO - this is failed so far, because Chrome shows password save dialog with
                    // restore code (instead of email), which is not helpful..
                    // Submit login form to trigger browser save password dialog
                    //m.formSubmitControl = 'submit';
                }
            })
            .catch(function (reason) {
                // Common case is when browser auto-fills Code with user's email.
                // In this case server will return 409 Conflict error because '@' in email is
                // invalid char for code. Improving experience by showing normal warning here.
                if (reason.status === _.const.http.CONFLICT) {
                    m.notify.show('warn', {title: 'Invalid code', text: 'Please make sure to copy the code correctly from email.'});
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
            m.notify.show('warn', {title: 'Error', text: err});

            // Temporarily override hide to erase error form qs
            var origHide = m.notify.hide;
            m.notify.hide = function () {
                eraseErrorFromQs();
                (m.notify.hide = origHide)();
            };
        }
    }

    function eraseErrorFromQs() {
        $state.go('.', null, {location: 'replace', inherit: false});
    }

    function getEmailFromQs() {
        var email = $stateParams['email'];
        if (email) {
            m.user.email = email;
        }
    }
}
