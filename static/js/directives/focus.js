angular
    .module('peersay')
    .directive('psFocusOn', psFocusOn);

psFocusOn.$inject = ['$timeout'];
function psFocusOn($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            var el = element.get(0);

            scope.$watch(attr.psFocusOn, function (newVal) {
                if (newVal) {
                    // Need to prevent $apply re-enter
                    $timeout(function () {
                        // Need to re-eval - see this:
                        //  https://docs.angularjs.org/error/$rootScope/inprog?p0=$digest
                        if (scope.$eval(attr.psFocusOn)) {
                            el.focus();
                            if (attr.psSelect) {
                                el.select();
                            }
                        }
                    }, 0, false);
                }
            });
        }
    };
}