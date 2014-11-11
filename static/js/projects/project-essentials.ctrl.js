/*global angular:true*/

angular.module('peersay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', 'Tiles', 'Projects'];
function ProjectEssentialsCtrl($scope, Tiles, Projects) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
    m.title = {};
    m.budget = {};
    m.duration = {};
    m.progress = {};
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                m.title = res.title;
                m.budget = res.budget;
                m.duration = res.duration;

                m.progress = getProgress(['title', 'budget', 'duration']);
                Tiles.setProgress(m.tile, m.progress);
            });

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
