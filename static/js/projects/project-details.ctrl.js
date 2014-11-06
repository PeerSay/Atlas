/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$scope', '$routeParams', 'Projects', 'Tiles'];
function ProjectDetailsCtrl($scope, $routeParams, Projects, Tiles) {
    var m = this;
    var id = Number($routeParams.projectId);

    m.project = {};
    // Toggle views
    m.tilesMode = 'norm';
    m.toggleTilesMode = toggleTilesMode;
    // Checklist
    m.checklist = Tiles.checklist;
    m.toggleTile = Tiles.toggleTile.bind(Tiles);
    // Tiles
    m.visible = Tiles.visible;

    // xxx
    m.dbg = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    activate();

    function activate() {
        getProject();

        Tiles.load('project-' + id);
        $scope.$on('$destroy', function () {
            Tiles.unload();
        });
    }

    function getProject() {
        Projects.getProject(id)
            .success(function () {
                m.project = Projects.curProject;
            });
    }

    function toggleTilesMode() {
        m.tilesMode = (m.tilesMode === 'norm') ? 'min' : 'norm';
    }
}
