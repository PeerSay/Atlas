angular.module('PeerSay')
    .controller('ProjectCategoryCtrl', ProjectCategoryCtrl);


ProjectCategoryCtrl.$inject = ['$scope', 'CategorySelect', 'Projects', 'Util'];
function ProjectCategoryCtrl($scope, CategorySelect, Projects, _) {
    var m = this;
    m.categories = CategorySelect.vm;

    var parent = $scope.$parent.cm;
    var projectId = parent.projectId;
    var project = null; // delayed
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

        Projects.readProject(projectId).then(function (res) {
            project = parent.project;

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
        project.selectedCategory = name;
        parent.patchProject();
        parent.onCategoryChange(name);
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
