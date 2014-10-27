/*global angular:true*/

angular.module('peersay')
    .factory('Users', Users);

Users.$inject = ['restApi', '$location', 'Menu', 'Storage'];
function Users(rest, $location, Menu, Storage) {
    var U = {};

    U.user = Storage.get('user') || {};
    U.setHeader = setHeader;
    U.getUser = getUser;
    U.logout = logout;

    setHeader();

    function getUser(id) {
        return rest.read('users', id)
            .success(function (res) {
                //console.log('registered:', res);
                U.user  = Storage.set('user', res.result);
                setHeader();
            })
            .error(function (res) {
                console.log('TODO handle register err: %O', res);
            });
    }

    function logout() {
        return rest.create('auth/logout', {}) // post
            .success(function () {
                U.user  = Storage.remove('name') || {};
                $location.path('/auth/login');
                setHeader();
            })
            .error(function (res) {
                console.log('TODO handle logout err: %O', res);
            });
    }



    // Menu
    //
    function setHeader() {
        var name = $location.path().replace(/\//g, '');
        Menu.setActivePage(name);
    }

    return U;
}
