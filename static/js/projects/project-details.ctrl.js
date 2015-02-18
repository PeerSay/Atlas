/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$scope', '$stateParams', 'Tiles', 'Util'];
function ProjectDetailsCtrl($scope, $stateParams, Tiles, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    // Tiles
    m.visible = Tiles.visible;
    // Checklist
    m.toggleTile = Tiles.toggleTile.bind(Tiles);
    // Tiles progress
    m.progressTotal = progressTotal;
    // Full view
    m.showFullView = showFullView;

    activate();

    function activate() {
        Tiles.load('project-' + m.projectId);
        $scope.$on('$destroy', function () {
            Tiles.unload();
        });
    }

    function progressTotal() {
        var total = Tiles.progressTotal;
        var val = total.max ? total.current / total.max * 100 : 0;
        return Math.floor(val + 0.5);
    }

    function showFullView(tile) {
        tile.show = true;
        Tiles.toggleTile(tile); // otherwise dialog html is not rendered
        Tiles.toggleFullView(true, tile.uri);
    }
}
