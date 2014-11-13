/*global angular:true*/

angular.module('peersay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', '$filter', 'Tiles', 'Projects'];
function ProjectEssentialsCtrl($scope, $filter, Tiles, Projects) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
    m.progress = {};
    // Editable fields
    m.title = {};
    m.budget = {};
    m['duration.days'] = {};
    m['duration.startedAt'] = {};
    m['duration.finishedAt'] = {};
    m.domain = {};
    m.curEdit = null;
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;
    m.toggleEditInline = toggleEditInline;
    m.saveEditInline = saveEditInline;
    m.displayValue = displayValue;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                m.title = res.title;
                m.budget = res.budget;
                m['duration.startedAt'] = res['duration.startedAt'];
                m['duration.finishedAt'] = res['duration.finishedAt'];
                m['duration.days'] = res['duration.days'];

                m.progress = getProgress(['title', 'budget', 'duration.days', 'domain']);
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

    function toggleEditInline(ctl, on) {
        Tiles.toggleFullView(true, m.tile.uri, on ? ctl.key : null);
    }

    function saveEditInline(ctl) {
        var data = {};
        data[ctl.key] = ctl.editValue;

        Projects.updateProject(m.projectId, data)
            .finally(function () {
                toggleEditInline(ctl, false);
            });
    }

    function displayValue(ctl) {
        switch(ctl.key) {
            case 'budget':
                return $filter('currency')(ctl.value, '$', 0);
            case 'duration.startedAt':
            case 'duration.finishedAt':
                return shortDate(ctl.value);
            case 'duration.days':
                return ctl.value + ' days';
            default:
                return ctl.value;
        }

        function shortDate(val) {
            var date = new Date(val);
            return date.toDateString();

        }
    }
}
