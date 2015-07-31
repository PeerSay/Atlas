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

            m.snapshots = buildSnapshotsList(res.presentation.snapshots);
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

    function buildSnapshotsList(arr) {
        return _.map(arr, function (it) {
            return buildListItem(it);
        });
    }

    function buildListItem(it) {
        return {
            id: it.id,
            title: it.title,
            /*pdfUrl: (_.findWhere(it.resources, {type: 'pdf'}) || {}).genericUrl,
            htmlUrl: ['/my/projects', m.projectId, 'presentations', it.id, 'html'].join('/')*/
        };
    }

    // Snapshots
    //
    function createPresentationSnapshot() {
        var data = {title: Projects.current.project.title};
        Projects.createPresentationSnapshot(m.projectId, data).then(function (res) {
            m.snapshots.push(buildListItem(res));
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