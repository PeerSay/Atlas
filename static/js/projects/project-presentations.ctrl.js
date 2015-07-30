/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectPresentationsCtrl', ProjectPresentationsCtrl);

ProjectPresentationsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'jsonpatch', 'Util'];
function ProjectPresentationsCtrl($scope, $stateParams, Projects, jsonpatch, _) {
    var m = this;
    m.projectId = $stateParams.projectId;
    m.patchObserver = null;
    m.data = {};
    m.snapshots = [];
    m.createPresentation = createPresentation;
    m.patchPresentation = patchPresentation;
    m.deletePresentation = deletePresentation;
    m.renderPresentationPDF = renderPresentationPDF;


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
        var list = [];
        _.forEach(arr, function (it) {
            var item = buildListItem(it);
            list.push(item);
        });
        return list;
    }

    function buildListItem(it) {
        return {
            id: it.id,
            title: it.title,
            pdfUrl: (_.findWhere(it.resources, {type: 'pdf'}) || {}).genericUrl,
            htmlUrl: ['/my/projects', m.projectId, 'presentations', it.id, 'html'].join('/')
        };
    }

    // Snapshots
    //
    function createPresentation() {
        var data = {title: Projects.current.project.title};
        Projects.createPresentation(m.projectId, data).then(function (res) {
            m.list.push(buildListItem(res));
        });
    }

    function deletePresentation(pres) {
        Projects.deletePresentation(m.projectId, pres.id).then(function (res) {
            var idx = m.list.indexOf(pres);
            m.list.splice(idx, 1);
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