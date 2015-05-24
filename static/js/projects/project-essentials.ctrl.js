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
    m.category = {};
    m.categories = [];
    m.selectCategory = selectCategory;
    m.addCategory = addCategory;
    m.deleteCategory = deleteCategory;

    activate();

    function activate() {
        Projects.readProject($stateParams.projectId)
            .then(function (res) {
                m.project = res;
                m.category.selected = res.selectedCategory || {};

                m.patchObserver = jsonpatch.observe(m.project);
                return m.project;
            });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });

        Projects.readCategories()
            .then(function (res) {
                m.categories = res;
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

    function selectCategory(category) {
        console.log('>>Selected: ', category);

        //TODO: server
    }

    function deleteCategory(category) {
        var idx = m.categories.indexOf(category);
        if (idx >= 0) {
            m.categories.splice(idx, 1);
        }

        if (category.name === m.category.selected.name) {
            m.category = {};
        }

        //TODO: server
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
