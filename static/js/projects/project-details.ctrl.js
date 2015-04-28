/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$stateParams', 'Wizard', 'Projects', 'Util'];
function ProjectDetailsCtrl($stateParams, Wizard, Projects, _) {
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
    // Footer fields
    m.fields = {
        summary: {},
        notes: {},
        recommendations: {}
    };
    m.initFields = initFields;
    m.updateField = updateField;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                initFields(res);
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

    function initFields(project) {
        var fields = ['summary', 'recommendations', 'notes'];
        _.forEach(fields, function (fld) {
            var field = m.fields[fld];
            field.name = fld;
            field.value = field.lastValue = project[fld] || '';
        });
    }

    function updateField(model) {
        // Manually build patch
        var patch = {
            op: 'replace',
            path: '/' + model.name,
            value: model.value
        };
        return Projects.patchProject(m.projectId, [patch]);
    }
}
