/*global angular:true*/

angular.module('peersay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', 'Tiles'];
function ProjectEssentialsCtrl($scope, Tiles) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.progress = {
        value: 2,
        total: 5
    };

    activate();

    function activate() {
        Tiles.setProgress(m.tile.uri, m.progress);
    }
}
