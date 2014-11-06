/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$scope', '$routeParams', 'Projects', 'Tiles'];
function ProjectDetailsCtrl($scope, $routeParams, Projects, Tiles) {
    var m = this;
    var id = Number($routeParams.projectId);

    m.project = {};
    // Toggle views
    m.tileView = 'norm';
    m.tileBtnClass = {
        'glyphicon-zoom-out': m.tileView === 'norm',
        'glyphicon-zoom-in': m.tileView === 'min'
    };
    m.toggleTileView = toggleTileView;
    // Checklist
    m.checklist = Tiles.checklist;
    m.curTile = curTile;
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

    function toggleTileView() {
        m.tileView = (m.tileView === 'norm') ? 'min' : 'norm';
    }

    function curTile() {
        return m.checklist.tiles[0]; // TODO
    }
}
