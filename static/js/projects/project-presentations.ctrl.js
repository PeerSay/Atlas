/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectPresentationsCtrl', ProjectPresentationsCtrl);

ProjectPresentationsCtrl.$inject = ['$stateParams', 'Projects', 'Util'];
function ProjectPresentationsCtrl($stateParams, Projects, _) {
    var m = this;
    m.projectId = $stateParams.projectId;
    m.list = [];
    m.readPresentations = readPresentations;
    m.createPresentation = createPresentation;
    m.deletePresentation = deletePresentation;
    m.renderPresentationPDF = renderPresentationPDF;


    activate();

    function activate() {
        readPresentations();
    }

    function readPresentations() {
        Projects.readPresentations(m.projectId).then(function (res) {
            m.list = buildList(res.presentations);
        });
    }

    function buildList(arr) {
        var list = [];
        _.forEach(arr, function (it) {
            var item = buildListItem(it);
            list.push(item);
        });
        return list;
    }

    function buildListItem(it) {
        return {
            id: it._id,
            title: it.title,
            pdf: _.findWhere(it.resources, {type: 'pdf'}) || null
        };
    }

    function createPresentation() {
        var data = { title: Projects.current.project.title };
        Projects.createPresentation(m.projectId, data).then(function (res) {
            m.list.push(buildListItem(res));
        });
    }

    function deletePresentation(pres) {
        console.log('>> Delete', pres.id);

        Projects.deletePresentation(m.projectId, pres.id).then(function (res) {
            var idx = m.list.indexOf(pres);
            m.list.splice(idx ,1);
        });
    }

    function renderPresentationPDF(pres) {
        Projects.renderPresentation(m.projectId, pres.id).then(function (res) {
            var idx = m.list.indexOf(pres);
            m.list.splice(idx ,1);
        });
    }
}