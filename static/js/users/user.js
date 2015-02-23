/*global angular:true*/

angular.module('PeerSay')
    .factory('User', User);

User.$inject = ['$http', 'Backend', 'Storage'];
function User($http, Backend, Storage) {
    var U = {};

    U.user = Storage.get('user') || {};
    U.readUser = readUser;
    U.logout = logout;

    function readUser() {
        return Backend.read(['user'])
            .then(function (user) {
                return (U.user = Storage.set('user', user));
            });
    }


    function logout() {
        return $http.post('/api/auth/logout', {logout: true})
            .success(function () {
                U.user = Storage.remove('user') || {};
            });
    }

    return U;
}
