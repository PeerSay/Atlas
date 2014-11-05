/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$routeParams', 'Projects', 'Tiles'];
function ProjectDetailsCtrl($routeParams, Projects, Tiles) {
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
    m.tiles = Tiles.tiles;
    m.curTile = m.tiles[0];
    m.toggleTile = Tiles.toggleTile.bind(Tiles);
    // Tiles
    m.visibleTiles = Tiles.visibleTiles;

    // xxx
    m.dbg = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    getProject();

    function getProject() {
        Projects.getProject(id)
            .success(function () {
                m.project = Projects.curProject;
            });
    }

    function toggleTileView() {
        m.tileView = (m.tileView === 'norm') ? 'min' : 'norm';
    }
}
