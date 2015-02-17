/*global angular:true*/

angular.module('peersay')
    .controller('ProjectTODOCtrl', ProjectTODOCtrl);

ProjectTODOCtrl.$inject = ['$scope', 'Tiles'];
function ProjectTODOCtrl($scope, Tiles) {
    var m = this;

    m.tile = $scope.$parent.tile;
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;


    function showFullView(control) {
        Tiles.toggleFullView(true, m.tile.uri, control);
    }
}
