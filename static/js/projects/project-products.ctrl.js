angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Projects', 'filterFilter', 'Util'];
function ProjectProductsCtrl($scope, $state, $stateParams, Projects, filterFilter, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.title = 'Products';
    m.onClose = onClose;
    m.goPrev = goPrev;
    m.goFirst = goFirst;
    // Data / Edit
    m.project = {};
    m.patchObserver = null;
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
    m.addNotFoundProduct = addNotFoundProduct;
    m.selectProduct = selectProduct;
    // Loading
    m.loadingMore = true;
    m.loadMoreProducts = loadMoreProducts;
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
    m.filterLiClass= filterLiClass;
    m.filterBtnClass= filterBtnClass;
    m.toggleFilter = toggleFilter;
    // Add new
    var emptyNew = {
        name: '',
        category: '',
        description: '',
        popularity: 100,
        selected: true,
        local: true
    };
    m.addNew = {
        show: false,
        model: angular.copy(emptyNew)
    };
    m.toggleAddNew = toggleAddNew;
    m.cancelAddNew = cancelAddNew;
    m.saveAddNew = saveAddNew;


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            addProductsToList(res.products, true);
            m.totalSelected = getTotalSelected();

            var category = m.category.selected = res.selectedCategory || {};
            var categoryName = !category.local ? category.name : null;
            Projects.readPublicProducts({category: categoryName}).then(function (res) {
                addProductsToList(res.products);
                m.loadingMore = false;
            });
        });

        Projects.readCategories(m.projectId).then(function (res) {
            m.categories = res;
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });
    }

    var productIdx = {};
    function addProductsToList(list, reset) {
        if (reset) {
            m.products = [];
            productIdx = {};
        }

        _.forEach(list, function (it) {
            var publicNotSelected = !reset && !productIdx[it.id];
            var privateSelected = reset && it.selected;
            if (privateSelected || publicNotSelected) {
                it.selected = it.selected || false; // add missing prop to public list items
                m.products.push(it);
            }
            productIdx[it.id] = true;
        })
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }

    function loadMoreProducts() {
        var maxPopularity = m.products.reduce(function (prev, cur) {
            return Math.min(prev, cur.popularity);
        }, 100);
        var category = m.category.selected;
        var categoryName = !category.local ? category.name : null;
        var params = {category: categoryName, maxPopularity: maxPopularity};

        m.loadingMore = true;
        Projects.readPublicProducts(params).then(function (res) {
            addProductsToList(res.products);
            m.loadingMore = false;
        });
    }

    // Category
    //
    function selectCategory(category) {
        m.project.selectedCategory = category;
        patchProject();

        addProductsToList(m.project.products, true); //reset!
        loadMoreProducts();
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

        var categoryName = (m.category.selected || {}).name;
        if (category.name === categoryName) {
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
    //XXX
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
    function addNotFoundProduct(val) {
        m.addNew.model.name = val;
        m.addNew.show = true;

        // TODO - this leads to bug: duble-add of new item + exception!!
        //var product = angular.extend({}, emptyNew, m.addNew.model);
        //return product; // returned is added to list
    }

    function selectProduct(product) {
        toggleProductVal(product, true);

        // TODO: focus (use ps-focus ?)
    }

    // Filters
    //
    function filterLiClass(name) {
        return {active: m.filter.name === name};
    }

    function filterBtnClass() {
        return {
            'fa-minus-square-o': m.filter.name === 'all',
            'fa-check-square-o': m.filter.name === 'selected',
            'fa-square-o': m.filter.name === 'not-selected'
        };
    }

    function toggleFilter(name) {
        m.filter.name = name;
        m.filter.expr = filterExpr[name];
    }

    // Add new
    function toggleAddNew() {
        m.addNew.show = !m.addNew.show;
    }

    function cancelAddNew() {
        m.addNew.show = false;
        angular.extend(m.addNew.model, emptyNew);
    }

    function saveAddNew() {
        var product = angular.extend({}, emptyNew, m.addNew.model);
        product.id = uniqueId(m.products);
        product.category = (m.category.selected || {}).name;

        addToProject(product);
        addProductsToList([product]);
        patchProject();

        cancelAddNew();
    }

    function uniqueId(arr) {
        return arr.reduce(function (prev, cur) {
            return Math.max(prev, cur.id);
        }, 0) + 1;
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
