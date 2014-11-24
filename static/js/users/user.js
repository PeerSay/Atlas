/*global angular:true*/

angular.module('peersay')
    .factory('User', User);

User.$inject = ['$http', 'restApi', 'Storage'];
function User($http, rest, Storage) {
    var U = {};

    U.user = Storage.get('user') || {};
    U.getUser = getUser;
    U.logout = logout;

    function getUser() {
        return rest.readAll(['user'])
            .success(function (res) {
                U.user = Storage.set('user', res.result);
            })
            .error(function (res) {
                console.log('TODO handle register err: %O', res);
            });
    }


    function logout() {
        return $http.post('/api/auth/logout', {})
            .success(function () {
                U.user = Storage.remove('user') || {};
            })
            .error(function (res) {
                console.log('TODO handle logout err: %O', res);
            });
    }

    return U;
}
