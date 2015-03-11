/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectEssentialsEditCtrl', ProjectEssentialsEditCtrl);

ProjectEssentialsEditCtrl.$inject = ['$stateParams', 'Wizard', 'Projects', 'jsonpatch'];
function ProjectEssentialsEditCtrl($stateParams, Wizard, Projects, jsonpatch) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[0];
    m.title = m.step.title;
    //Wizard
    m.onClose = function () {
        Wizard.closeDialog(m.step);
    };
    m.goNext = function () {
        Wizard.next({from: m.step});
    };
    m.onShow = onShow;
    m.focusField = null;
    // Edits
    m.patchObserver = null;
    m.project = null;
    m.patchProject = patchProject;

    activate();

    function activate() {
        Projects.readProject($stateParams.projectId)
            .then(function (res) {
                m.project = res;
                m.patchObserver = jsonpatch.observe(m.project);
                return m.project;
            });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }
        console.log('Project patch: ', JSON.stringify(patch));

        Projects.patchProject(m.projectId, patch);
    }

    function onShow() {
        m.focusField = $stateParams.edit;
    }
}
