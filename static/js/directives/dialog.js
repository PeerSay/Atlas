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
            var $el = $(element).modal({
                show: false
            });

            $el.on('hide.bs.modal', function () {
                // digest for $search change
                scope.$apply(function () {
                    Tiles.toggleFullView(false);
                });
            });

            scope.$watch('toggle', function (newVal) {
                if (scope.dlg === newVal.dlg) {
                    $el.modal('show');
                }
            }, true);
        }
    };
}