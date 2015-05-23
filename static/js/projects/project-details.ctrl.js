/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$stateParams', '$state', 'Projects', 'Util'];
function ProjectDetailsCtrl($stateParams, $state, Projects, _) {
    var m = this;

    m.projectId = $stateParams.projectId;

    //Model
    m.project = null;
    //XXX
    m.products = [
        {name: 'ABC'},
        {name: 'New Product1'},
        {name: 'One'}
    ];

    m.requirements = [
        {title: 'Free as beer'},
        {title: 'Legendary support'}
    ];

    // Footer fields
    m.fields = {
        summary: {},
        notes: {},
        recommendations: {}
    };
    m.initFields = initFields;
    m.updateField = updateField;
    //Navigation
    m.openEditDialog = openEditDialog;


    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                initFields(res);
                return (m.project = res);
            });

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

    function openEditDialog(field) {
        $state.go('.essentials', {edit: field});
    }
}
