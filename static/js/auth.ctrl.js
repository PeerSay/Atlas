/*global angular:true*/

angular.module('peersay')
    .controller('Auth', Auth);

Auth.$inject = ['restApi', '$location'];

function Auth(rest, $location) {
    var m = this;

    m.error = {
        show: false,
        msg: "Something's wrong"

    };
    m.user = {
        email: 'a@a',
        password: '1'
    };
    m.signup = signup;
    m.login = login;


    function signup() {
        m.form.$setPristine();

        rest.register(m.user)
            .then(function (res) {
                //console.log('registered:', res);
                $location.path('/dashboard');
            })
            .catch(function (res) {
                //console.log('Err: %O',s res);
                var err = res.data.error;
                if (err) {
                    m.error.msg = err;
                }
                m.error.show = true;
            });
    }

    function login() {
        m.form.$setPristine();

        rest.authenticate(m.user)
            .then(function (res) {
                //console.log('ok:', res);
                $location.path('/dashboard');
            })
            .catch(function (res) {
                //console.log('fail');
                var err = res.data.error;
                if (err) {
                    m.error.msg = err;
                }
                m.error.show = true;
            });
    }

}
