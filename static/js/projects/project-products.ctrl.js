angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$interpolate', '$stateParams', 'Wizard', 'Table', 'TableModel'];
function ProjectProductsCtrl($interpolate, $stateParams, Wizard, Table, TableModel) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[2];
    m.title = m.step.title;
    m.openDialog = Wizard.openDialog.bind(Wizard);
    m.footer = {
        text: getFooterTextFn()
    };

    // Table view
    m.tableView = Table.addView(m, 'pi-norm', getViewConfig)
        //.debug()
        .grouping()
        .sorting({active: false})
        .done();

    function getViewConfig(model) {
        // Columns: Prod1, [Prod2, Prod3] | {Products}
        var res = [
            {
                selector: 'vendors/.*?/input',
                limit: 3,
                cell: {
                    type: 'ordinary'
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


    function getFooterTextFn() {
        var exp = $interpolate('Showing {{ shown }} out of {{ total }}');
        return function () {
            var shown = (m.tableView.rows[0] || []).length;
            var total = (TableModel.model.vendors || []).length;
            return exp({shown: shown, total: total});
        };
    }
}
