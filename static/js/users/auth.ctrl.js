/*global angular:true*/

angular.module('peersay')
    .controller('AuthCtrl', AuthCtrl);

AuthCtrl.$inject = ['Users'];
function AuthCtrl(Users) {
    var m = this;
    m.error = {
        show: false,
        msg: "Something is wrong"
    };
    m.user = {
        email: 'a@a',
        password: '123123'
    };
    m.signup = signup;
    m.login = login;

    Users.setHeader(); // switch menu upon navigation

    function signup() {
        m.form.$setPristine();

        Users.signup(m.user)
            .catch(function (res) {
                var err = res.data.error;
                if (err) {
                    m.error.msg = err;
                }
                m.error.show = true;
            });
    }

    function login() {
        m.form.$setPristine();

        Users.login(m.user)
            .catch(function (res) {
                var err = res.data.error;
                if (err) {
                    m.error.msg = err;
                }
                m.error.show = true;
            });
    }
}
