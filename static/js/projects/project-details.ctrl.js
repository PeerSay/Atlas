/*global angular:true*/

angular.module('peersay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);


ProjectDetailsCtrl.$inject = ['$scope', '$routeParams', 'Tiles', 'Util'];
function ProjectDetailsCtrl($scope, $routeParams, Tiles, _) {
    var m = this;

    m.projectId = $routeParams.projectId;
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

    activate();

    function activate() {
        Tiles.load('project-' + m.projectId);
        $scope.$on('$destroy', function () {
            Tiles.unload();
        });
    }

    function tileProgressLabel(tile) {
        return tile.progress.total ?
            [tile.progress.value, tile.progress.total].join('/') : '';
    }

    function tileProgressClass(tile) {
        var value = tile.progress.value;
        var total = tile.progress.total;
        var part = value / total * 100;
        var in_range = _.map([0, 20, 40, 60, 80, 100], function (v) {
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

    function showFullView(tile) {
        tile.show = true;
        Tiles.toggleTile(tile); // otherwise dialog html is not rendered
        Tiles.toggleFullView(true, tile.uri);
    }
}
