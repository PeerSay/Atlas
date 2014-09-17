angular.module('peersay').controller('helloCtrl', ['$scope', '$window', 'restApi',

    function ($scope, $window, api) {
        $scope.hello = 'Hello World!';
        $scope.helloApi = '';
        $scope.helloSocket = '';

        api.hello()
            .success(function (res) {
                if (res.error) {
                    throw new Error(res.message);
                } else {
                    $scope.helloApi = JSON.stringify(res);
                }
            });
    }
]);
