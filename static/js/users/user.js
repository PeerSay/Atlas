/*global angular:true*/

angular.module('PeerSay')
    .factory('User', User);

User.$inject = ['$http', 'Backend', 'Storage'];
function User($http, Backend, Storage) {
    var U = {};

    U.user = Storage.get('user') || {};
    U.signup = signup;
    U.login = login;
    U.logout = logout;
    U.restorePwd = restorePwd;
    U.restorePwdComplete = restorePwdComplete;
    U.readUser = readUser;

    function signup(data) {
        return Backend.post(['auth', 'signup'], data);
    }

    function login(data) {
        return Backend.post(['auth', 'login'], data);
    }

    function logout() {
        return $http.post('/api/auth/logout', {logout: true})
            .success(function () {
                U.user = Storage.remove('user') || {};
            });
    }

    function restorePwd(data) {
        return Backend.post(['auth', 'restore'], data);
    }

    function restorePwdComplete(data) {
        return Backend.post(['auth', 'restore', 'complete'], data);
    }

    function readUser() {
        return Backend.read(['user'])
            .then(function (data) {
                return (U.user = Storage.set('user', data.result));
            });
    }

    return U;
}
