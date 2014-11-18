angular
    .module('peersay')
    .directive('psTileTable', psTileTable);

function psTileTable() {
    return {
        restrict: 'E',
        templateUrl: 'html/tile-table.html',
        scope: {
            tableParams: '=psTableParams',
            ctl: '=ctl'
        }
    };
}