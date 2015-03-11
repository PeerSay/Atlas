/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$stateParams', 'Wizard', 'Projects'];
function ProjectDetailsCtrl($stateParams, Wizard, Projects) {
    var m = this;

    m.projectId = $stateParams.projectId;
    // Wizard
    m.steps = Wizard.steps;
    m.isReached = Wizard.isReached.bind(Wizard);
    m.openDialog = Wizard.openDialog.bind(Wizard);
    m.stepClass = stepClass;
    //Model
    m.project = null;
    m.openEditDialog = openEditDialog;

    activate();

    function activate() {
        Projects.readProject($stateParams.projectId)
            .then(function (res) {
                return (m.project = res);
            });
    }

    function stepClass(step) {
        return {
            active: step.reached,
            disabled: !step.enabled,
            current: step.current
        };
    }

    function openEditDialog(field) {
        m.openDialog(m.steps[0], field);
    }
}
