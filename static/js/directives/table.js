angular
    .module('peersay')
    .directive('psTable', psTable);

function psTable() {
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