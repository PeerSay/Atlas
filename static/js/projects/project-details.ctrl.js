/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$stateParams', 'Wizard'];
function ProjectDetailsCtrl($stateParams, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.steps = Wizard.steps;
    m.progress = Wizard.progress.bind(Wizard);
    m.isReached = Wizard.isReached.bind(Wizard);
    m.openDialog = Wizard.openDialog.bind(Wizard);
    m.stepClass = stepClass;

    function stepClass(step) {
        return {
            active: step.reached,
            disabled: !step.enabled,
            current: step.current
        };
    }
}
