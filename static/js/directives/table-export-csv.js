angular
    .module('PeerSay')
    .config(['$compileProvider', function($compileProvider) {
        // allow data links
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
    }])
    .directive('psExportCsv', psExportCsv);


psExportCsv.$inject = ['$parse', 'Util', 'TableModel'];
function psExportCsv($parse, _, TableModel) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var data = '';
            var csv = {
                generate: function() {
                    data = TableModel.viewModel.getCSV();
                },
                link: function() {
                    // Work only in Chrome?
                    // See this: http://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
                    //
                    return 'data:text/csv;charset=UTF-8,' + encodeURIComponent(data);
                }
            };
            $parse(attrs.psExportCsv).assign(scope.$parent, csv);
        }
    };
}
