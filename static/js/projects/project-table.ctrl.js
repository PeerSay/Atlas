angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$interpolate', '$stateParams', 'Table', 'TableModel'];
function ProjectTableCtrl($scope, $interpolate, $stateParams, Table, TableModel) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.openDialog = openDialog;
    m.info = getInfoFn();

    // Table view
    m.tableView = Table.addView(m, 'main', getViewConfig)
        //.debug()
        //.grouping()
        //.sorting({active: false})
        //.hovering()
        .done();

    $scope.$on('$destroy', function () {
        m.tableView.destroy();
    });

    function getViewConfig(model) {
        // Columns: Criteria, Weight, [Prod1-input, Prod1-grade], ...
        var res = [
            {
                selector: 'name',
                cell: {
                    type: 'ordinary',
                    emptyValue: 'No name?'
                }
            },
            {
                selector: 'weight',
                cell: {
                    type: 'number-static'
                }
            },
            {
                selector: 'vendors/.*?/input',
                limit: 3,
                cell: {
                    type: 'ordinary'
                }
            },
            {
                selector: 'vendors/.*?/score',
                limit: 3,
                cell: {
                    type: 'number-static',
                    computed: {
                        max: ['row', Table.aggr.rowIsMax]
                    }
                },
                footer: {
                    computed: {
                        total: ['col,col:weight', Table.aggr.columnTotalScore],
                        max: ['footer', Table.aggr.rowIsMax]
                    }
                }
            }
        ];

        var vendors = model.vendors;
        if (!vendors.length) {
            res.push({
                selector: null,
                columnModel: { field: 'Products', value: 'Products'}, // show at least on column
                cellModels: ['name'] // first cell is used for grouping and must have criteria
            });
        }
         return res;
    }


    function getInfoFn() {
        var exp = $interpolate('Showing {{ shown }} out of {{ total }}');
        return function () {
            var shown = (m.tableView.rows[0] || []).length;
            var total = (TableModel.model.vendors || []).length;

            return {
                show: (total > shown),
                text: exp({shown: shown, total: total})
            };
        };
    }

    function openDialog() {
        //TODO
    }
}
