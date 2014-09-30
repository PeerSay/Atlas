/*global angular:true*/

angular.module('peersay')
    .factory('restApi', restApi);

restApi.$inject = ['$http'];

function restApi($http) {
    var service = {
        getHello: getHello
    };
    return service;


    function getHello() {
        var url = '/api';
        return $http.get(url);
    }
}
