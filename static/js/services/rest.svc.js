/*global angular:true*/

angular.module('peersay')
    .factory('restApi', restApi);

restApi.$inject = ['$http', '$q'];

function restApi($http, $q) {
    var service = {
        readAll: readAll,
        read: read,
        update: update,
        create: create,
        remove: remove
    };
    return service;

    // General CRUD rule:
    // create → POST    /collection
    // read →   GET     /collection[/id]
    // update → PUT     /collection/id
    // patch →  PATCH   /collection/id
    // delete → DELETE  /collection/id

    function readAll(collection) {
        var url = '/api/' + collection;
        return $http.get(url);
    }

    function read(doc, id) {
        var url = '/api/' + doc + '/' + id;
        return $http.get(url);
    }

    function update(doc, data) {
        var url = '/api/' + doc + '/' + data.id;
        return $http.put(url, data);
    }

    function create (doc, data) {
        var url = '/api/' + doc;
        return $http.post(url, data);
    }

    function remove (doc, id) {
        var url = '/api/' + doc + '/' + id;
        return $http.delete(url);
    }
}
