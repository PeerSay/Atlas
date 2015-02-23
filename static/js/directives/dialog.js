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
                show: false
            });

            $el.on('show.bs.modal', function () {
                //hide previous
                var curModal = this;
                $(".modal").each(function() {
                    if (this !== curModal) {
                        $(this).modal("hide");
                    }
                });
            });

            $el.on('shown.bs.modal', function () {
                if (!scope.onShow) { return; }

                scope.$apply(function () {
                    scope.onShow();
                });
            });

            $el.on('hide.bs.modal', function () {
                scope.$apply(function () {
                    scope.onClose();
                });
            });

            // Show
            $el.modal('show'); // triggered manually to let show to trigger show event

            // Clean-up
            element.on('$destroy', function () {
                //$el.modal('hide'); //close to remove share when navigating away
                $el.off('show.bs.modal shown.bs.modal hidden.bs.modal');
            });
        }
    };
}