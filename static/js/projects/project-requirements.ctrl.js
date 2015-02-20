angular.module('PeerSay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$stateParams', 'Table', 'Wizard'];
function ProjectRequirementsCtrl($stateParams, Table, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[1];
    m.title = m.step.title;

    // Table views
    m.groupBy = Table.groupBy;

    m.tableView = Table.addView(m, 'ev-norm', getViewConfig)
        //.debug()
        .grouping()
        .sorting({active: false})
        .done();

    function getViewConfig() {
        // Columns: Criteria
        return [
            {
                selector: 'name',
                cell: {
                    type: 'ordinary',
                    emptyValue: 'No name?'
                }
            }
        ];
    }
}
