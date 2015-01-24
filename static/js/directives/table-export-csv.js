angular
    .module('peersay')
    .config(['$compileProvider', function($compileProvider) {
        // allow data links
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
    }])
    .directive('psExportCsv', psExportCsv);


psExportCsv.$inject = ['$parse', 'Util'];
function psExportCsv($parse, _) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var titles = scope.$parent.cm.titles;
            var data = '';
            var values = [];

            var csv = {
                stringify: function(str) {
                    var res = str
                        .replace(/^\s*/, '').replace(/\s*$/, '') // trim spaces
                        .replace(/"/g,'""'); // replace quotes with double quotes;
                    if (res.search(/("|,|\n)/g) >= 0) {
                        res = '"' + res + '"'; // quote if contains special chars
                    }
                    return res;
                },
                generate: function() {
                    //prepare data
                    values = [titles];
                    _.forEach(scope.cm.criteria, function (o) {
                        values.push([o.name, o.description, o.group, o.priority]);
                    });
                    //console.log('>>values', values);

                    //convert to cvs
                    data = '';
                    _.forEach(values, function (row) {
                        _.forEach(row, function (val, j) {
                            var txt = (val === null) ? '' : val.toString();
                            var result = csv.stringify(txt);
                            if (j > 0) {
                                data += ',';
                            }
                            data += result;
                        });
                        data += '\n';
                    });
                    //console.log('>>csv', data);
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
