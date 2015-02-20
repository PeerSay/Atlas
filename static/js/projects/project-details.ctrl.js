/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Wizard'];
function ProjectDetailsCtrl($scope, $state, $stateParams, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.steps = Wizard.steps;
    m.progress = Wizard.progress.bind(Wizard);
    m.stepClass = stepClass;
    m.openStepDialog = openStepDialog;

    function stepClass(step) {
        return {
            active: step.reached,
            disabled: !step.enabled
        };
    }

    function openStepDialog(step) {
        $state.go(step.state);

        /*if (!step.enabled) { return; }

        if (step.reached) {
            $state.go(step.state);
        } else {
            // TODO - next
        }*/
    }

}
