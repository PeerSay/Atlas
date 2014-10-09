/*global angular:true*/

angular.module('peersay')
    .controller('Auth', Auth);

Auth.$inject = ['restApi', '$location'];

function Auth(rest, $location) {
    var m = this;

    m.showError = false;
    m.user = {
        email: 'a@a',
        password: '1'
    };
    m.signup = signup;
    m.login = login;


    function signup() {
        console.log(m.user);

        rest.register(m.user.email, m.user.password)
            .then(function (res) {
                console.log('ok:', res);
                $location.path('/dashboard');
            })
            .catch(function () {
                console.log('fail');
            });
    }

    function login() {
        console.log(m.user);

        rest.authenticate(m.user.email, m.user.password)
            .then(function (res) {
                console.log('ok:', res);
                $location.path('/dashboard');
            })
            .catch(function () {
                console.log('fail');
            });
    }

}
