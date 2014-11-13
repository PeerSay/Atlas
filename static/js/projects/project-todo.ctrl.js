/*global angular:true*/

angular.module('peersay')
    .controller('ProjectTODOCtrl', ProjectTODOCtrl);

ProjectTODOCtrl.$inject = ['$scope', 'Tiles'];
function ProjectTODOCtrl($scope, Tiles) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.progress = {
        value: 0,
        total: 1
    };
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;

    activate();

    function activate() {
        Tiles.setProgress(m.tile, m.progress);
        $scope.$on('$destroy', function () {
            m.progress = { value: 0, total: 0 };
            Tiles.setProgress(m.tile, m.progress);
        });
    }

    function showFullView(control) {
        Tiles.toggleFullView(true, m.tile.uri, control);
    }
}
