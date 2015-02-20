angular
    .module('PeerSay')
    .directive('psTileDialog', psTileDialog);

psTileDialog.$inject = ['jQuery'];
function psTileDialog($) {
    return {
        restrict: 'A',
        scope: {
            onClose: '=psOnClose',
            onShow: '=psOnShow'
        },
        link: function (scope, element) {
            // Hack to prevent focus which breaks auto-show input-edits feature - no effect
            //$().modal.Constructor.prototype.enforceFocus = function () {};

            var $el = $(element).modal({
                backdrop: 'static',
                show: true
            });

            $el.on('hide.bs.modal', function () {
                scope.$apply(function () {
                    scope.onClose();
                });
            });

            $el.on('shown.bs.modal', function () {
                scope.$apply(function () {
                    if (scope.onShow) {
                        scope.onShow();
                    }
                });
            });

            // Clean-up
            element.on('$destroy', function () {
                //$el.modal('hide'); //close to remove share when navigating away
                $el.off('shown.bs.modal hidden.bs.modal');
            });
        }
    };
}