angular
    .module('peersay')
    .directive('psTileDialog', psTileDialog);

psTileDialog.$inject = ['Tiles'];
function psTileDialog(Tiles) {
    return {
        restrict: 'A',
        scope: {
            toggle: '=psToggle',
            dlg: '=psDlgUri'
        },
        link: function (scope, element) {
            // Hack to prevent focus which breaks auto-show input-edits feature - no effect
            //$().modal.Constructor.prototype.enforceFocus = function () {};

            var $el = $(element).modal({
                show: false
            });

            $el.on('hidden.bs.modal', function () {
                // need to toggle off only on manual close, not on navigation
                if (!scope.dlg) { return;}

                // digest for $search change
                scope.$apply(function () {
                    Tiles.toggleFullView(false);
                });
            });

            scope.$watch('toggle.dlg', function (newVal, oldVal) {
                var on = (scope.dlg === newVal) ? 'show'  : 'hide';
                $el.modal(on);
            }, true);
        }
    };
}