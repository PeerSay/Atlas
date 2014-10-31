angular
    .module('peersay')
    .directive('psDialog', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $(element).modal({
                    show: false
                });
            }
        };
    });