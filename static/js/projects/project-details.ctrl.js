/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$scope', '$routeParams', 'Projects', 'Tiles'];
function ProjectDetailsCtrl($scope, $routeParams, Projects, Tiles) {
    var m = this;
    var id = Number($routeParams.projectId);

    m.project = {};
    // Toggle views
    m.tilesMode = 'norm';
    m.toggleTilesMode = toggleTilesMode;
    // Tiles
    m.visible = Tiles.visible;
    // Checklist
    m.checklist = Tiles.checklist;
    m.toggleTile = Tiles.toggleTile.bind(Tiles);

    m.progressTile = progressTile;
    m.progressTotal = progressTotal;
    m.progressLabel = progressLabel;

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

    function toggleTilesMode() {
        m.tilesMode = (m.tilesMode === 'norm') ? 'min' : 'norm';
    }

    function progressLabel(tile) {
        return tile.progress.total ?
            [tile.progress.value, tile.progress.total].join('/') :
            '';
    }

    function progressTile(tile, $event) {
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
        Tiles.setProgress(tile.uri, progress);

        setProgressStyle(tile, next, total);
    }

    function setProgressStyle(tile, value, total) {
        var part = value / total * 100;
        var in_range = $.map([0, 20, 40, 60, 80, 100], function (v) {
            if (part <= v) { return v; }
            return null;
        })[0];
        //console.log('>>After: next: %s, part: %s, in_range: ', value, part, in_range);

        tile.progressClass = 'progress-' + in_range;
    }

    function progressTotal() {
        var total = Tiles.progressTotal;
        var val = total.max ? total.current / total.max * 100 : 0;
        return Math.floor(val + 0.5);
    }
}
