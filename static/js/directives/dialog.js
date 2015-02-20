angular
    .module('PeerSay')
    .directive('psTileDialog', psTileDialog);

psTileDialog.$inject = ['Wizard'];
function psTileDialog(Wizard) {
    return {
        restrict: 'A',
        scope: {
            toggle: '=psToggle',
            dlg: '=psDlgUri',
            onShow: '=psOnShow'
        },
        link: function (scope, element) {
            // Hack to prevent focus which breaks auto-show input-edits feature - no effect
            //$().modal.Constructor.prototype.enforceFocus = function () {};

            var $el = $(element).modal({
                backdrop: 'static',
                show: true
            });

            $el.on('hidden.bs.modal', function () {
                // need to toggle off only on manual close, not on navigation
                //if (!scope.dlg) { return; }

                // digest for $search change
                scope.$apply(function () {
                    //Tiles.toggleFullView(false);
                    Wizard.closeDialog();
                });
            });

            $el.on('shown.bs.modal', function () {
                scope.$apply(function () {
                    if (scope.onShow) {
                        scope.onShow();
                    }
                });
            });

            /*scope.$watch('toggle.dlg', function (newVal) {
                var on = (scope.dlg === newVal) ? 'show'  : 'hide';
                $el.modal(on);
            }, true);*/

            // Clean-up
            element.on('$destroy', function () {
                $el.off('shown.bs.modal hidden.bs.modal');
                $el.modal('hide'); //close to remove share when navigating away
            });
        }
    };
}