/*global angular:true*/

angular.module('peersay').controller('helloCtrl', ['$scope', '$window', 'restApi', 'socket',

    function ($scope, $window, api, socket) {
        $scope.hello = 'Hello World!';
        $scope.helloApi = '';
        $scope.socketMsg = '';

        api.hello()
            .success(function (res) {
                if (res.error) {
                    throw new Error(res.message);
                } else {
                    $scope.helloApi = JSON.stringify(res);
                }
            });

        socket.on('msg', function (msg) {
            $scope.socketMsg = msg;
        });
    }
]);
