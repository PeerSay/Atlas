angular.module('PeerSay')
    .controller('ProjectListCategoryCtrl', ProjectListCategoryCtrl);


ProjectListCategoryCtrl.$inject = ['$scope', 'CategorySelect', 'Projects', 'Util'];
function ProjectListCategoryCtrl($scope, CategorySelect, Projects, _) {
    var m = this;
    m.categories = CategorySelect.vm;

    var parent = $scope.$parent.list;
    var newProject = parent.newProject;
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

        $scope.$on('$destroy', function () {
            offSelect();
            CategorySelect.reset();
            resetModel();
        });
    }

    function selectCategory(name) {
        newProject.category = name;
        newProject.customCategory = false;
    }

    function addCategory(item) {
        newProject.category = item.name;
        newProject.customCategory = true;
    }

    function removeCategory(name, isSelected) {
        if (isSelected) {
            resetModel();
        }
    }

    function resetModel() {
        newProject.category = null;
        newProject.customCategory = false;
    }
}
