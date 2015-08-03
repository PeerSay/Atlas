/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectPresentationsCtrl', ProjectPresentationsCtrl);

ProjectPresentationsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'jsonpatch', 'Util'];
function ProjectPresentationsCtrl($scope, $stateParams, Projects, jsonpatch, _) {
    var m = this;
    m.projectId = $stateParams.projectId;
    m.data = {};
    m.snapshots = [];
    m.patchObserver = null;
    m.patchPresentation = patchPresentation;
    m.creating = false;
    m.createPresentationSnapshot = createPresentationSnapshot;
    m.deletePresentationSnapshot = deletePresentationSnapshot;


    activate();

    function activate() {
        readPresentation();
    }

    function readPresentation() {
        Projects.readPresentation(m.projectId).then(function (res) {
            m.data = res.presentation.data;
            m.patchObserver = jsonpatch.observe(m.data);

            m.snapshots = res.presentation.snapshots;
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.data, m.patchObserver);
        });
    }

    function patchPresentation() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        return Projects.patchPresentation(m.projectId, patch);
    }

    // Snapshots
    //
    function createPresentationSnapshot() {
        var data = {title: Projects.current.project.title};

        m.creating = true;
        Projects.createPresentationSnapshot(m.projectId, data)
            .then(function (res) {
                m.snapshots.push(res);
            })
            .finally(function () {
                m.creating = false;
            });
    }

    function deletePresentationSnapshot(snap) {
        Projects.deletePresentationSnapshot(m.projectId, snap.id).then(function (res) {
            var idx = m.snapshots.indexOf(snap);
            m.snapshots.splice(idx, 1);
        });
    }

    function renderPresentationPDF(pres) {
        pres.rendering = true;
        Projects.renderPresentationPDF(m.projectId, pres.id)
            .then(function (res) {
                pres.pdfUrl = res;
            })
            .finally(function () {
                pres.rendering = false;
            });
    }
}