angular.module('peersay')
    .controller('ProjectEvaluationRequirementsCtrl', ProjectEvaluationRequirementsCtrl);

ProjectEvaluationRequirementsCtrl.$inject = ['$scope', '$filter', 'Tiles', 'ngTableParams'];
function ProjectEvaluationRequirementsCtrl($scope, $filter, Tiles, ngTableParams) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.progress = {
        value: 0,
        total: 1
    };
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;

    // Tables
    m.criteria = [
        {
            id: 1,
            name: "Initial Capacity",
            description: '12TB Basic (end of 2015)',
            table: 'required',
            group: null
        },
        {
            id: 2,
            name: "Initial Capacity",
            description: '12TB Basic (end of 2015)',
            table: 'required',
            group: null
        },
        {
            id: 3,
            name: "Scale Up Growth",
            description: 'Another 10 TB',
            table: 'optional',
            group: null
        },
        {
            id: 4,
            name: "Network Connections",
            description: 'NAS / ISCSI',
            table: 'optional',
            group: 'Network'
        }
    ];

    var tableSettings = {
        counts: [],
        total: 0,
        getData: function ($defer, params) {
            var filter = params.filter();
            var filtered = $filter('filter')(m.criteria, filter);
            $defer.resolve(filtered);
        }
    };
    m.normTableParams = new ngTableParams({
        count: 10
    }, tableSettings);
    m.reqTableParams = new ngTableParams({
        count: 10,
        filter: { table: 'required' }
    }, angular.extend(tableSettings, {groupBy: 'group'}));
    m.optTableParams = new ngTableParams({
        count: 10,
        filter: { table: 'optional' }
    }, angular.extend(tableSettings, {groupBy: 'group'}));

    m.reloadTables = reloadTables;

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

    function reloadTables () {
        m.reqTableParams.reload();
        m.optTableParams.reload();
    }
}