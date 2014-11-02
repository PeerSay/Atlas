angular
    .module('peersay')
    .directive('psFocusOn', psFocusOn);

psFocusOn.$inject = ['$timeout'];
function psFocusOn($timeout) {
    return {
        restrict: 'A',
        scope: {
            toggle: '=psFocusOn'
        },
        link: function (scope, element) {
            var el = element.get(0);
            scope.$watch('toggle', function (val) {
                if (el && val) {
                    el.select();
                    // Has troubles without timeout:
                    // http://stackoverflow.com/questions/17599504/why-focus-on-textbox-is-not-set-inside-a-twitter-bootstrap-modal-popup-by-angu
                    $timeout(function () {
                        el.focus();
                    }, 200);
                }
            });
        }
    };
}