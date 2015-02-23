angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$stateParams', 'Table', 'Wizard'];
function ProjectProductsCtrl($stateParams, Table, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[2];
    m.title = m.step.title;
    m.openDialog = Wizard.openDialog.bind(Wizard);

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
}
