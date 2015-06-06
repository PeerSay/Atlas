/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'jsonpatch', 'Util'];
function ProjectEssentialsCtrl($scope, $stateParams, Projects, jsonpatch, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.focusField = null;
    // Edits
    m.project = null;
    m.patchObserver = null;
    m.patchProject = patchProject;
    // Categories
    m.category = {};
    m.categories = [];
    m.groupByCategory = groupByCategory;
    m.selectCategory = selectCategory;
    m.addCategory = addCategory;
    m.deleteCategory = deleteCategory;
    // Currency
    m.currencyLabels = []; // list from DB
    m.amountMultipliers =  []; // list from DB
    m.selectCurrency = selectCurrency;
    m.selectMultiplier = selectMultiplier;
    // Time
    m.durationLabels = []; // list from DB
    m.selectDurationLabel = selectDurationLabel;

    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            m.currencyLabels = res.budget.currencyLabels.split(',');
            m.amountMultipliers = res.budget.amountMultipliers.split(',');
            m.durationLabels = res.time.durationLabels.split(',');

            var categoryName = res.selectedCategory;
            if (categoryName) {
                m.category.selected = {name: categoryName};
            }

            m.categories = [].concat(res.categories); // copy of local
            Projects.readPublicCategories().then(function (res) {
                m.categories = [].concat(m.categories, res.categories); // merge local+global
            });

            return m.project;
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });

        m.focusField = $stateParams.edit;
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }

    // Category
    //

    function groupByCategory(item) {
        return item.domain || '';
    }

    function selectCategory(category) {
        m.project.selectedCategory = category.name;
        patchProject();
    }

    function addCategory(val) {
        var exist = _.findWhere(m.categories, {name: val});
        if (exist) { return; } // XXX - API must handle too

        var item = {
            name: val,
            domain: '',
            local: true
        };
        m.categories.unshift(item); // all

        m.project.categories.unshift(item); // local
        patchProject();

        return item;
    }

    function deleteCategory(category) {
        _.removeItem(m.categories, category);
        _.removeItem(m.project.categories, category);

        if (category.name === m.category.selected.name) {
            m.category = {};
            m.project.selectedCategory = '';
        }

        patchProject();
    }

    // Currency / Labels
    //
    function selectCurrency(currency) {
        m.project.budget.currencyLabel = currency;
        patchProject();
    }

    function selectMultiplier(mul) {
        m.project.budget.amountMultiplier = mul;
        patchProject();
    }

    function selectDurationLabel(label) {
        m.project.time.durationLabel = label;
        patchProject();
    }
}
