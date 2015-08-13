angular.module('PeerSay')
    .factory('CategorySelect', CategorySelect)
    .controller('ProjectCategoryCtrl', ProjectCategoryCtrl);

ProjectCategoryCtrl.$inject = ['$scope', 'CategorySelect', 'Projects', 'Util'];
function ProjectCategoryCtrl($scope, CategorySelect, Projects, _) {
    var m = this;
    m.categories = CategorySelect.vm;

    var parent = $scope.$parent.$parent.cm; // ng-include adds another parent
    var projectId = parent.projectId;
    var project = parent.project;
    var offSelect = CategorySelect.on(function (evt, type) {
        var dispatch = {
            select: selectCategory,
            add: addCategory,
            remove: removeCategory
        };
        var args = [].slice.call(arguments, 2);

        dispatch[type].apply(null, args);
    });

    activate();

    function activate() {
        Projects.readPublicCategories(projectId).then(function (res) {
            CategorySelect.load(res.categories);
        });

        Projects.readProject(projectId).then(function (res) {
            CategorySelect.load(res.categories); // custom

            if (res.selectedCategory) {
                CategorySelect.init(res.selectedCategory);
            }
        });

        $scope.$on('$destroy', function () {
            offSelect();
            CategorySelect.reset();
        });
    }

    function selectCategory(name) {
        var categoryName = project.selectedCategory = name;
        parent.patchProject();
        parent.onCategoryChange(categoryName);
    }

    function addCategory(item) {
        project.categories.unshift(item); // custom
        parent.patchProject();
    }

    function removeCategory(name, isSelected) {
        var projectItem = _.findWhere(project.categories, {name: name});
        _.removeItem(project.categories, projectItem);

        if (isSelected) {
            project.selectedCategory = null;
            parent.onCategoryChange(null);
        }
        parent.patchProject();
    }
}


CategorySelect.$inject = ['$rootScope', 'Util'];
function CategorySelect($rootScope, _) {
    var C = {};
    // View model for ui-select
    C.vm = {
        list: [],
        model: {}, // of ui-select
        select: select,
        groupBy: groupBy,
        add: add,
        remove: remove
    };
    //For the outer world
    C.init = init;
    C.getSelected = getSelected;
    C.load = load;
    C.reset = reset;
    C.on = on;

    function load(items) {
        C.vm.list = C.vm.list.concat(items);
    }

    function reset() {
        C.vm.list = [];
    }

    function init(val) {
        C.vm.model.selected = {name: val};
    }

    function getSelected() {
        return (C.vm.model.selected || {}).name || '';
    }

    function select($model) {
        $rootScope.$emit('category.select', 'select', $model.name);
    }

    function on(fn) {
        return $rootScope.$on('category.select', fn);
    }

    function groupBy(item) {
        return item.domain || '';
    }

    function add(val) {
        var exist = _.findWhere(C.vm.list, {name: val});
        if (exist) { return; }

        var item = {
            name: val,
            domain: '',
            custom: true
        };
        C.vm.list.unshift(item);

        $rootScope.$emit('category.select', 'add', item);

        return item; // add to list
    }

    function remove(item) {
        _.removeItem(C.vm.list, item);

        var isCurrent = (item.name === getSelected());
        if (isCurrent) {
            C.vm.model = {};
        }

        $rootScope.$emit('category.select', 'remove', item.name, isCurrent);
    }

    return C;
}