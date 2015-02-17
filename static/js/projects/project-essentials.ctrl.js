/*global angular:true*/

angular.module('peersay')
    .controller('ProjectEssentialsCtrl', ProjectEssentialsCtrl);

ProjectEssentialsCtrl.$inject = ['$scope', '$filter', 'Tiles', 'Projects', 'Util'];
function ProjectEssentialsCtrl($scope, $filter, Tiles, Projects, _) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;
    // Editable fields
    m.fields = {
        title: {},
        budget: {},
        'duration.days': {},
        'duration.startedAt': {},
        'duration.finishedAt': {},
        domain: {}
    };
    // Inline edits
    m.toggleEditInline = toggleEditInline;
    m.saveEditInline = updateProject;
    m.displayValue = displayValue;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (project) {
                _.forEach(m.fields, function (fld, key) {
                    // ensure missing fields are added to Projects obj
                    m.fields[key] = project[key] = project[key] || missingField(key);
                });
            });
    }

    function missingField(key) {
        return {
            key: key,
            value: '',
            status: 'missing'
        };
    }

    function getProgress(fields) {
        var progress = { value: 0, total: 0 };

        _.forEach(fields, function (fld) {
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

    function updateProject(ctl, value) {
        var data = {};
        data[ctl.key] = value;

        Projects.updateProject(m.projectId, data)
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
