/*global angular:true*/

angular.module('peersay')
    .factory('Users', Users);

Users.$inject = ['restApi', '$location', 'Menu', 'Storage'];
function Users(rest, $location, Menu, Storage) {
    var U = {};

    U.user = Storage.get('user') || {};
    U.signup = signup;
    U.login = login;
    U.logout = logout;
    U.setHeader = setHeader;

    setHeader();

    function signup (user) {
        return restRegister(user)
            .success(function (res) {
                //console.log('registered:', res);
                U.user  = Storage.set('user', res.result);
                $location.path('/projects');
                setHeader();
            })
            .error(function (res) {
                console.log('TODO handle register err: %O', res);
            });
    }

    function login(user) {
        return restAuthenticate(user)
            .success(function (res) {
                console.log('login:', res);
                U.user  = Storage.set('user', res.result);
                $location.path('/projects');
                setHeader();
            })
            .error(function (res) {
                console.log('TODO handle auth err: %O', res);
            });
    }


    function logout() {
        return restLogout()
            .success(function () {
                U.user  = Storage.remove('name') || {};
                $location.path('/auth/login');
                setHeader();
            })
            .error(function (res) {
                console.log('TODO handle logout err: %O', res);
            });
    }


    // Auth API services
    //
    function restRegister (user) {
        return rest.create('auth/signup', user);
    }

    function restAuthenticate (user) {
        return rest.create('auth/login', user);
    }

    function restLogout() {
        return rest.create('auth/logout', {});
    }


    // Menu
    //
    function setHeader() {
        var name = $location.path().replace(/\//g, '');
        Menu.setActivePage(name);
    }

    return U;
}
