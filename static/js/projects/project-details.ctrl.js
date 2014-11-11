/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$scope', '$routeParams', 'Projects', 'Tiles'];
function ProjectDetailsCtrl($scope, $routeParams, Projects, Tiles) {
    var m = this;
    var id = $routeParams.projectId;

    m.project = {};
    // Toggle view mode
    m.viewMode = Tiles.viewMode;
    m.toggleViewMode = Tiles.toggleViewMode.bind(Tiles);
    m.viewModeBtnClass = viewModeBtnClass;
    // Tiles
    m.visible = Tiles.visible;
    // Checklist
    m.checklist = Tiles.checklist;
    m.toggleTile = Tiles.toggleTile.bind(Tiles);
    // Tiles progress
    m.progressTotal = progressTotal;
    m.tileProgressLabel = tileProgressLabel;
    m.tileProgressClass = tileProgressClass;
    m.setTileProgress = setTileProgress;
    // Full view
    m.showFullView = showFullView;

    // xxx
    m.dbg = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    activate();

    function activate() {
        readProject();

        Tiles.load('project-' + id);
        $scope.$on('$destroy', function () {
            Tiles.unload();
        });
    }

    function readProject() {
        Projects.readProject(id)
            .then(function (res) {
                m.project = res;
            });
    }

    function tileProgressLabel(tile) {
        return tile.progress.total ?
            [tile.progress.value, tile.progress.total].join('/') :
            '';
    }

    function tileProgressClass(tile) {
        var value = tile.progress.value;
        var total = tile.progress.total;
        var part = value / total * 100;
        var in_range = $.map([0, 20, 40, 60, 80, 100], function (v) {
            if (part <= v) { return v; }
            return null;
        })[0];
        //console.log('>>After: next: %s, part: %s, in_range: ', value, part, in_range);

        return 'progress-' + in_range;
    }

    function setTileProgress(tile, $event) {
        var dir = $event.altKey ? -1 : 1;
        var progress = tile.progress;
        var total = progress.total;
        //console.log('>>Before: %s of %s', progress.value, total);

        var next = progress.value + dir;
        if (next < 0) {
            next = total;
        }
        next = next % (total + 1);

        progress.value = next;
        Tiles.setProgress(tile, progress);
    }

    function progressTotal() {
        var total = Tiles.progressTotal;
        var val = total.max ? total.current / total.max * 100 : 0;
        return Math.floor(val + 0.5);
    }

    function viewModeBtnClass() {
        return {
            'glyphicon-zoom-out': m.viewMode.value === 'norm',
            'glyphicon-zoom-in': m.viewMode.value === 'min'
        };
    }

    function showFullView(tile) {
        tile.show = true;
        Tiles.toggleTile(tile); // otherwise dialog html is not rendered
        Tiles.toggleFullView(true, tile.uri);
    }
}
