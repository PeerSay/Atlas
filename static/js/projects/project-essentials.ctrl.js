/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Projects', 'jsonpatch', 'Util'];
function ProjectEssentialsCtrl($scope, $state, $stateParams, Projects, jsonpatch, _) {
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
    // Currency
    m.currencies = ['USD', 'EUR', 'GBP', 'ILS', 'RUB','BTC'];
    m.selectCurrency = selectCurrency;
    // Time
    m.durationLabels = ['days', 'weeks', 'months'];
    m.selectDurationLabel = selectDurationLabel;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                m.project = res;
                m.category.selected = res.selectedCategory || {};

                m.patchObserver = jsonpatch.observe(m.project);
                return m.project;
            });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });

        Projects.readCategories(m.projectId)
            .then(function (res) {
                m.categories = res;
            });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }

    // Category
    //
    function selectCategory(category) {
        m.project.selectedCategory = category;
        patchProject();

        //TODO: server
    }

    function addCategory(val) {
        var item = {
            id: nextId(m.categories),
            name: val,
            domain: 'Default',
            local: true
        };
        m.categories.unshift(item); // all
        m.project.categories.unshift(item); // local
        patchProject();

        return item;
    }

    function deleteCategory(category) {
        removeItem(m.categories, category);
        removeItem(m.project.categories, category);

        if (category.name === m.category.selected.name) {
            m.category = {};
            m.project.selectedCategory = null;
        }

        patchProject();
    }

    function removeItem(arr, item) {
        var idx = arr.indexOf(item);
        if (idx >= 0) {
            arr.splice(idx, 1);
        }
        return item;
    }

    function nextId(arr) {
        var res = 0;
        _.forEach(arr, function (it) {
            res = Math.max(it.id, res) + 1;
        });
        return res;
    }

    // Currency / Labels
    //
    function selectCurrency(currency) {
        m.project.resources.budgetCurrency = currency;
        patchProject();
    }

    function selectDurationLabel(label) {
        m.project.time.durationLabel = label;
        patchProject();
    }

    // Navigation
    //
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
