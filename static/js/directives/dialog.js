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
                console.log('>>> Directive toggle off: ', scope.dlg);
                Tiles.toggleFullView(false);
                scope.$apply(); // digest for $search changes
            });

            scope.$watch('toggle', function (newVal, oldVal) {
                console.log('>>> Directive toggle on: new[%s], old[%s]', newVal.dlg, oldVal.dlg);
                console.log('>>> Directive toggle on: new[%s], old[%s]', newVal.control, oldVal.control);

                if (scope.dlg === newVal.dlg) {
                    $el.modal('show');
                }
            }, true);
        }
    };
}