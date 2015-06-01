angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Projects', 'filterFilter', 'Util'];
function ProjectProductsCtrl($scope, $state, $stateParams, Projects, filterFilter, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
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
        all: {removed: '!true'},
        selected: {selected: true, removed: '!true'},
        'not-selected': {selected: false, removed: '!true'}
    };
    m.filter = {
        name: 'all',
        expr: filterExpr.all
    };
    m.filterLiClass= filterLiClass;
    m.filterBtnClass= filterBtnClass;
    m.toggleFilter = toggleFilter;
    // Add/remove new
    var emptyNew = {
        name: '',
        category: '',
        description: '',
        popularity: 100,
        selected: true,
        custom: true
    };
    m.addNew = {
        show: false,
        model: angular.copy(emptyNew)
    };
    m.toggleAddNew = toggleAddNew;
    m.cancelAddNew = cancelAddNew;
    m.saveAddNew = saveAddNew;
    m.removeCustomProduct = removeCustomProduct;


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            addProductsToList(res.products, true);
            m.totalSelected = getTotalSelected();

            var category = m.category.selected = res.selectedCategory || {};
            var categoryName = !category.custom ? category.name : null;
            Projects.readPublicProducts({category: categoryName}).then(function (res) {
                addProductsToList(res.products, false, {selected: false});
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
    function addProductsToList(list, reset, extend) {
        if (reset) {
            m.products = [];
            productIdx = {};
        }

        _.forEach(list, function (it) {
            var publicNotSelected = !reset && !productIdx[it.id];
            var local = !!reset;
            var skipIt = !(local || publicNotSelected);

            if (skipIt) { return; }

            productIdx[it.id] = true;

            var copy = angular.extend({}, it, extend);
            m.products.push(copy);
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
        var categoryName = !category.custom ? category.name : null;
        var params = {category: categoryName, maxPopularity: maxPopularity};

        m.loadingMore = true;
        Projects.readPublicProducts(params).then(function (res) {
            addProductsToList(res.products, false, {selected: false});
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
            custom: true
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
    function toggleProduct(product, invert) {
        var val = invert ? !product.selected : product.selected;
        toggleProductVal(product, val);
    }

    function toggleProductVal(product, val) {
        product.selected = val;

        addRemoveLocal(product);
        patchProject();

        m.totalSelected = getTotalSelected();
    }

    function getTotalSelected() {
        return filterFilter(m.project.products, filterExpr.selected).length;
    }

    // Select / Add new
    //
    function addNotFoundProduct(val) {
        m.addNew.show = true;
        m.addNew.model.name = val;

        var copy = angular.extend({}, emptyNew, m.addNew.model, {selected: false});
        return copy; // added to list!
    }

    function selectProduct(product) {
        // Item without id is newly added, it should not be propagated to table/project
        if (!product.id) { return; }

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

        addProductsToList([product]);

        addRemoveLocal(product);
        patchProject();

        cancelAddNew();
    }

    function removeCustomProduct(product) {
        product.selected = false;
        product.removed = true;
        addRemoveLocal(product, true);
        patchProject();
    }

    function addRemoveLocal(prod, forceRemove) {
        var localProds = m.project.products;
        var localProd = _.findWhere(localProds, {id: prod.id});
        var localIdx = localProds.indexOf(localProd);
        var inProject = (localIdx >= 0);

        if (prod.selected) {
            if (inProject && prod.custom) {
                localProd.selected = true;
            } else {
                localProds.push(angular.copy(prod)); // copy!
            }
        }

        if (!prod.selected && inProject) {
            if (!prod.custom || forceRemove) {
                localProds.splice(localIdx, 1);
            }
            else {
                localProd.selected = false;
            }
        }
    }

    function uniqueId(arr) {
        return arr.reduce(function (prev, cur) {
            return Math.max(prev, cur.id);
        }, 0) + 1;
    }
}
