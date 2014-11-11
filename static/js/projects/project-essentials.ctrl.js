/*global angular:true*/

angular.module('peersay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', 'Tiles'];
function ProjectEssentialsCtrl($scope, Tiles) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.title = $scope.$parent.m.project.title;
    m.budget = $scope.$parent.m.project.budget;
    m.duration = $scope.$parent.m.project.duration;
    m.progress = getProgress(['title', 'budget', 'duration']);
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

    function getProgress(fields) {
        var progress = { value: 0, total: 0 };

        angular.forEach(fields, function (fld) {
            progress.total++;
            if (m[fld].ok) {
                progress.value++;
            }
        });

        return progress;
    }

    function showFullView(control) {
        Tiles.toggleFullView(true, m.tile.uri, control);
    }
}
