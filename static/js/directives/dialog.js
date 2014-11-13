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

            $el.on('hide.bs.modal', function () {
                // digest for $search change
                scope.$apply(function () {
                    Tiles.toggleFullView(false);
                });
            });

            //console.log('>>Init dialog: ', scope.dlg);

            scope.$watch('toggle.dlg', function (newVal, oldVal) {
                //console.log('>>Modal evt watch: [%s]->[%s]', oldVal, newVal);

                if (scope.dlg === newVal) {
                    $el.modal('show');
                }
            }, true);
        }
    };
}