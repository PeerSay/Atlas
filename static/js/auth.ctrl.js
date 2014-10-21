/*global angular:true*/

angular.module('peersay')
    .controller('AuthCtrl', AuthCtrl)
    .controller('MainCtrl', MainCtrl); // TOOD: proper place


function MainCtrl() { // TODO: to proper place
    var m = this;

    m.setActivePage = function (name) {
        m.activePage = name;
    };
}

AuthCtrl.$inject = ['restApi', '$location', '$scope'];
function AuthCtrl(rest, $location, $scope) {
    var m = this;
    var pm = $scope.pm; // access parent scope

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
    m.logout = logout;

    setHeader();

    function signup() {
        m.form.$setPristine();

        rest.register(m.user)
            .then(function (res) {
                //console.log('registered:', res);
                $location.path('/projects');
                setHeader();
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
                $location.path('/projects');
                setHeader();
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

    function logout() {
        rest.logout()
            .then(function () {
                $location.path('/login');
                setHeader();
            });
    }

    function setHeader() {
        var name = $location.path().replace(/\//g, '');
        pm.setActivePage(name);
    }
}
