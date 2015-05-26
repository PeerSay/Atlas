/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$stateParams', '$state', 'Projects', 'Util'];
function ProjectDetailsCtrl($stateParams, $state, Projects, _) {
    var m = this;

    m.projectId = $stateParams.projectId;

    //Model
    m.project = null;
    m.requirements = [];
    m.products = [
        {name: 'TODO'}
    ];

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
                m.requirements = res.requirements;

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
}
