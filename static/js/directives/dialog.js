angular
    .module('PeerSay')
    .directive('psTileDialog', psTileDialog);

psTileDialog.$inject = ['jQuery', '$timeout'];
function psTileDialog($, $timeout) {
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
                show: false
            });
            var destroyed = false;

            $el.on('shown.bs.modal', function () {
                if (!scope.onShow) { return; }

                $timeout(function () {
                    scope.onShow();
                }, 0);
            });

            $el.on('hide.bs.modal', function () {
                if (destroyed || !scope.onClose) { return; }

                scope.$apply(function () {
                    scope.onClose();
                });
            });

            // Show - async to let $destroy run first, otherwise modal('hide') removes .modal-open class
            // and breaks scroll of long modals
            $timeout(function () {
                $el.modal('show'); // triggered manually to let show to trigger show event
            }, 0, false);

            // Clean-up
            element.on('$destroy', function () {
                // When navigating away (e.g. on Back), the state is destroyed together with
                // element, but backdrop el remains. Thus, calling hide to remove it.
                // Also need to prevent onClose() call on 'hide.bs.modal' event, cause
                // it can cause unwanted navigation.
                destroyed = true;
                $el.modal('hide');

                $el.off('shown.bs.modal hidden.bs.modal');
            });
        }
    };
}