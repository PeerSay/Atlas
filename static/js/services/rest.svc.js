/*global angular:true*/

angular.module('peersay')
    .factory('restApi', restApi);

// General CRUD rule:
// create → POST    /collection
// read →   GET     /collection[/id]
// update → PUT     /collection/id
// patch →  PATCH   /collection/id
// delete → DELETE  /collection/id

restApi.$inject = ['$http', '$q'];
function restApi($http, $q) {
    var service = {
        readAll: request('get'),
        read: request('get'),
        update: request('put'),
        create: request('post'),
        remove: request('delete')
    };
    return service;

    function request(method) {
        return function (params, data) {
            params.unshift('/api');
            var url = params.join('/');

            return $http[method](url, data);
        }
    }
}
