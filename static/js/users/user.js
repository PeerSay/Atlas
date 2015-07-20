/*global angular:true*/

angular.module('PeerSay')
    .factory('User', User);

User.$inject = ['$rootScope', '$state', '$http', 'Backend', 'Storage'];
function User($rootScope, $state, $http, Backend, Storage) {
    var U = {};

    U.user = {};
    U.isAuthorized = isAuthorized;
    U.showLoginPage = showLoginPage;
    U.signup = signup;
    U.login = login;
    U.logout = logout;
    U.restorePwd = restorePwd;
    U.restorePwdComplete = restorePwdComplete;
    U.readUser = readUser;


    activate();

    function activate() {
        U.user = Storage.get('user') || {};

        $rootScope.$on('ps.user.not-authorized', function () {
            updateUser(null);
            showLoginPage({err: 'Session is expired. Please login again.'});
        });
    }

    function isAuthorized() {
        return !!U.user.authorized;
    }

    function showLoginPage(params) {
        $state.go('auth.login', params);
    }

    function signup(data) {
        return Backend.post(['auth', 'signup'], data)
            .then(function (res) {
                updateUser({authorized: true});
                return res;
            });
    }

    function login(data) {
        return Backend.post(['auth', 'login'], data)
            .then(function (res) {
                updateUser({authorized: true});
                return res;
            });
    }

    function logout() {
        return $http.post('/api/auth/logout', {logout: true})
            .success(function (res) {
                updateUser(null);
                showLoginPage(null);
                return res;
            });
    }

    function restorePwd(data) {
        return Backend.post(['auth', 'restore'], data);
    }

    function restorePwdComplete(data) {
        return Backend.post(['auth', 'restore', 'complete'], data)
            .then(function (res) {
                updateUser({authorized: true});
                return res;
            });
    }

    function readUser() {
        return Backend.read(['user'])
            .then(function (data) {
                return updateUser(data.result);
            });
    }

    function updateUser(data) {
        if (data) {
            U.user = angular.extend(U.user, data);
            Storage.set('user', U.user);
        } else {
            Storage.remove('user');
            U.user = {};
        }
        return U.user;
    }

    return U;
}
