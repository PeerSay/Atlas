/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Projects', 'jsonpatch'];
function ProjectEssentialsCtrl($scope, $state, $stateParams, Projects, jsonpatch) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.project = {};

    m.title = 'Essentials';
    m.focusField = null;
    m.onShow = onShow;
    m.onClose = onClose;
    m.goNext = goNext;
    m.goLast = goLast;
    // Edits
    m.patchObserver = null;
    m.project = null;
    m.patchProject = patchProject;
    // Categories
    m.category = {}; // selection
    m.categories = [];
    m.addCategory = addCategory;

    activate();

    function activate() {
        Projects.readProject($stateParams.projectId)
            .then(function (res) {
                m.project = res;
                m.categories = res.categories;

                m.patchObserver = jsonpatch.observe(m.project);
                return m.project;
            });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }

    function addCategory(val) {
        var item = {
            name: val,
            domain: 'Default',
            local: true
        };
        m.categories.unshift(item);

        return item;
    }

    function onShow() {
        m.focusField = $stateParams.edit;
    }

    function onClose() {
        $state.go('^');
    }

    function goNext() {
        $state.go('^.requirements');
    }

    function goLast() {
        $state.go('^.products');
    }
}
