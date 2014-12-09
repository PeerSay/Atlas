angular
    .module('peersay')
    .directive('psTileTable', psTileTable);

function psTileTable() {
    return {
        restrict: 'E',
        templateUrl: 'html/table.html',
        scope: {
            tableParams: '=psTableParams',
            ctl: '=',
            titles: '='
        }
    };
}