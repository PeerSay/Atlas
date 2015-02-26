/*global angular:true*/

angular.module('PeerSay')
    .factory('User', User);

User.$inject = ['$http', 'Backend', 'Storage'];
function User($http, Backend, Storage) {
    var U = {};

    U.user = Storage.get('user') || {};

    U.login = login;
    U.logout = logout;
    U.readUser = readUser;

    function login(data) {
        return Backend.post(['auth', 'login'], data);
    }

    function logout() {
        return $http.post('/api/auth/logout', {logout: true})
            .success(function () {
                U.user = Storage.remove('user') || {};
            });
    }

    function readUser() {
        return Backend.read(['user'])
            .then(function (data) {
                return (U.user = Storage.set('user', data.result));
            });
    }

    return U;
}
