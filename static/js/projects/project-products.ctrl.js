angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'Util', 'jsonpatch'];
function ProjectProductsCtrl($scope, $stateParams, Projects, _, jsonpatch) {
    var m = this;

    m.projectId = $stateParams.projectId;
    // Data / Edit
    m.project = {};
    m.patchObserver = null;
    m.patchProject = patchProject;
    m.loadingMore = true;
    // Products / Selection
    m.product = {}; // ui-select model
    m.products = [];
    m.toggleProduct = toggleProduct;
    m.totalSelected = 0;
    m.addNotFoundProduct = addNotFoundProduct;
    m.selectProduct = selectProduct;
    // Filters
    m.filter = {
        visible: {removed: '!true'},
        selected: {selected: true, removed: '!true'}
    };
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
    // Categories
    m.onCategoryChange = onCategoryChange;


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            observe({products: res.products});

            // Products
            addProductsToList(res.products, true);
            loadPublicProducts({q: res.selectedCategory});
        });

    }

    function observe(project) {
        m.patchObserver = jsonpatch.observe(project);

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(project, m.patchObserver);
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; } //XXX - return promise!

        return Projects.patchProject(m.projectId, patch);
    }

    var productIdx = {};

    function addProductsToList(list, reset, extend) {
        if (reset) {
            m.products = [];
            productIdx = {};
        }

        _.forEach(list, function (it) {
            var publicNotSelected = !reset && !productIdx[it._id];
            var local = !!reset;
            var skipIt = !(local || publicNotSelected);

            if (skipIt) { return; }

            productIdx[it._id] = true;

            var copy = angular.extend({}, it, extend);
            m.products.push(copy);
        });
    }

    function loadPublicProducts(params) {
        m.loadingMore = true;
        return Projects.readPublicProducts(params)
            .then(function (res) {
                addProductsToList(res.products, false, {selected: false});
            })
            .finally(function () {
                m.loadingMore = false;
            });
    }

    // Category
    //
    function onCategoryChange(categoryName) {
        // Build new list of products
        addProductsToList(m.project.products, true); //reset!
        loadPublicProducts({q: categoryName});
    }

    //Selection
    //
    function toggleProduct(product, invert) {
        var val = invert ? !product.selected : product.selected;
        toggleProductVal(product, val);
    }

    function toggleProductVal(product, val) {
        product.selected = product.focus = val; // set focus on selected

        addRemoveToProject(product);
        patchProject();
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
        if (!product._id) { return; }

        toggleProductVal(product, true);

        // TODO: focus (use ps-focus ?)
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
        var categoryName = m.project.selectedCategory;
        var product = angular.extend({}, emptyNew, m.addNew.model, {category: categoryName});

        addRemoveToProject(product);
        patchProject().then(function (res) {
            // XXX - patch may return non-promise
            product._id = res._id; //get id from server response
            addProductsToList([product]);
        });

        cancelAddNew();
    }

    function removeCustomProduct(product) {
        product.selected = false;
        product.removed = true;
        addRemoveToProject(product, true);
        patchProject();
    }

    function addRemoveToProject(prod, forceRemove) {
        var localProds = m.project.products;
        var localProd = _.findWhere(localProds, {_id: prod._id});
        var localIdx = localProds.indexOf(localProd);
        var inProject = (localIdx >= 0);

        if (prod.selected) {
            if (inProject && prod.custom) {
                localProd.selected = true;
            } else if (!prod.custom){
                localProds.push(angular.copy(prod)); // copy!
            } else {
                localProds.push(prod); // shared, cause _id will be updated after req
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
}
