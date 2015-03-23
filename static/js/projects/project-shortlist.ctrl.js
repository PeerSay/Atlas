angular.module('PeerSay')
    .controller('ProjectShortlistCtrl', ProjectShortlistCtrl);

ProjectShortlistCtrl.$inject = ['$stateParams', '$interpolate', 'Table', 'TableModel', 'Util', 'Wizard'];
function ProjectShortlistCtrl($stateParams, $interpolate, Table, TableModel, _, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[3];
    m.title = m.step.title;
    m.openDialog = Wizard.openDialog.bind(Wizard);
    m.info = getInfoFn();

    // Table views
    m.tableView = Table.addView(m, 'sh-norm', getViewConfig)
        //.debug()
        .grouping()
        .sorting({active: false})
        .watching() //!
        .done();

    function getViewConfig(model) {
        // Columns: Score1, [Score2, Score3] | {Products}
        var res = [
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
            // show at least one column if no vendors added yet
            res.push({
                selector: null,
                columnModel: { field: 'Products', value: 'Products'},
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
}
