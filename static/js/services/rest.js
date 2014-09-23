angular.module('peersay').factory('restApi', ['$http', function ($http) {
    return {
        hello: function () {
            var url = '/api';
            return $http.get(url);
        }
    };
}]);

