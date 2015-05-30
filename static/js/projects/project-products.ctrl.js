angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Projects', 'filterFilter'];
function ProjectProductsCtrl($scope, $state, $stateParams, Projects, filterFilter) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.title = 'Products';
    m.project = {};
    m.onClose = onClose;
    m.goPrev = goPrev;
    m.goFirst = goFirst;
    // Categories - TODO - unify with Essentials
    m.category = {}; // ui-select model
    m.categories = [];
    m.selectCategory = selectCategory;
    m.addCategory = addCategory;
    m.deleteCategory = deleteCategory;
    // Products / Selection
    m.product = {}; // ui-select model
    m.products = [];
    m.toggleProduct = toggleProduct;
    m.totalSelected = 0;
    // Add new
    m.addProduct = addProduct;
    m.selectProduct = selectProduct;
    // Filters
    var filterExpr = {
        all: {},
        selected: {selected: true},
        'not-selected': {selected: false}
    };
    m.filter = {
        name: 'all',
        expr: {}
    };


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.category.selected = res.selectedCategory || {};
            m.totalSelected = getTotalSelected();

            m.patchObserver = jsonpatch.observe(m.project);
            return m.project;
        });

        Projects.readCategories(m.projectId).then(function (res) {
            m.categories = res;
        });

        Projects.readProducts(m.projectId).then(function (res) {
            m.products = res.products;
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

    // Category
    //
    function selectCategory(category) {
        m.project.selectedCategory = category;
        patchProject();
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
        _.removeItem(m.categories, category);
        _.removeItem(m.project.categories, category);

        if (category.name === m.category.selected.name) {
            m.category = {};
            m.project.selectedCategory = null;
        }

        patchProject();
    }

    function nextId(arr) {
        var res = 0;
        _.forEach(arr, function (it) {
            res = Math.max(it.id, res) + 1;
        });
        return res;
    }

    //Selection
    //
    $scope.products = m.products;
    $scope.$watch('products.selected', function (newVal) {
        console.log('>> Watch: ', newVal)
    }, true);

    function toggleProduct(product, invert) {
        var val = invert ? !product.selected : product.selected;
        toggleProductVal(product, val);
    }

    function toggleProductVal(product, val) {
        product.selected = val;

        addToProject(product);
        patchProject();

        m.totalSelected = getTotalSelected();
    }

    function addToProject(product) {
        var localIdx = m.project.products.indexOf(product);
        var added = (localIdx >= 0);

        if (product.selected && !added) {
            m.project.products.unshift(product);
        }
    }

    function getTotalSelected() {
        return filterFilter(m.project.products, filterExpr.selected).length;
    }

    // Select / Add new
    //
    function addProduct(val) {
        console.log('>>addProduct: ', val);
    }

    function selectProduct(product) {
        toggleProductVal(product, true);

        // TODO: focus (use ps-focus ?)
    }


    // Navigation
    //
    function onClose() {
        $state.go('^');
    }

    function goPrev() {
        $state.go('^.requirements');
    }

    function goFirst() {
        $state.go('^.essentials');
    }
}
