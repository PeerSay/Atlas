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
    m.fields = {
        title: {},
        budget: {},
        'duration.days': {},
        'duration.startedAt': {},
        'duration.finishedAt': {},
        domain: {}
    };
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;
    // Inline edits
    m.toggleEditInline = toggleEditInline;
    m.saveEditInline = saveEditInline;
    m.displayValue = displayValue;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                angular.forEach(m.fields, function (fld, key) {
                    m.fields[key] = res[key] || missingField(key);
                    res[key] = m.fields[key]; // add missing field which Projects knows not about
                });

                setProgress();
            });

        $scope.$on('$destroy', function () {
            m.progress = { value: 0, total: 0 };
            Tiles.setProgress(m.tile, m.progress);
        });
    }

    function missingField(key) {
        return {
            key: key,
            value: '',
            status: 'missing'
        };
    }

    function setProgress() {
        m.progress = getProgress(['title', 'budget', 'duration.days', 'domain']);
        Tiles.setProgress(m.tile, m.progress);
    }

    function getProgress(fields) {
        var progress = { value: 0, total: 0 };

        angular.forEach(fields, function (fld) {
            progress.total++;
            if (m.fields[fld].status === 'ok') {
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

    function saveEditInline(ctl, value) {
        var data = {};
        data[ctl.key] = value;

        Projects.updateProject(m.projectId, data)
            .success(function () {
                setProgress();
            })
            .finally(function () {
                toggleEditInline(ctl, false);
            });
    }

    function displayValue(ctl) {
        switch (ctl.key) {
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
