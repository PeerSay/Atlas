angular.module('PeerSay')
    .controller('ProjectCategoryCtrl', ProjectCategoryCtrl);


ProjectCategoryCtrl.$inject = ['$scope', 'CategorySelect', 'Projects', 'Util', 'ProjectPatcherMixin'];
function ProjectCategoryCtrl($scope, CategorySelect, Projects, _, ProjectPatcherMixin) {
    var m = ProjectPatcherMixin(this, $scope);
    m.categories = CategorySelect.vm;

    var parent = $scope.$parent.cm; // access via scope hierarchy
    var project = null; // delayed
    var model = null;

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
        Projects.readPublicCategories().then(function (res) {
            CategorySelect.load(res.categories);
        });

        Projects.readProject(parent.projectId).then(function (res) {
            project = res;
            model = {selectedCategory: res.selectedCategory};
            m.observe(model);

            CategorySelect.load(res.categories, {top: true}); // custom

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
        model.selectedCategory = name; // observed
        project.selectedCategory = name; // not observed
        m.patchProject();
        parent.onCategoryChange(name);
    }

    function addCategory(item) {
        project.categories.unshift(item); // custom
        m.patchProject();
    }

    function removeCategory(name, isSelected) {
        var projectItem = _.findWhere(project.categories, {name: name});
        _.removeItem(project.categories, projectItem);

        if (isSelected) {
            model.selectedCategory = null;
            project.selectedCategory = null;
            parent.onCategoryChange(null);
        }
        m.patchProject();
    }
}
