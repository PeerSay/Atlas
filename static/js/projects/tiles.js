/*global angular:true*/

angular.module('peersay')
    .factory('Tiles', Tiles);

Tiles.$inject = ['$rootScope', 'TileLocation'];
function Tiles($rootScope, TileLocation) {
    var T = {};

    T.tiles = [
        {
            uri: 'es',
            name: 'essentials',
            title: 'Project Essentials',
            progress: '1/10',
            show: false,
            html: '/html/project-essentials.html'
        },
        {
            uri: 'ev',
            name: 'evaluation',
            title: 'Evaluation Requirements',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            uri: 'vi',
            name: 'vendor-input',
            title: 'Vendor Input',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            uri: 'sh',
            name: 'shortlists',
            title: 'Shortlists',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            uri: 'po',
            name: 'pocs',
            title: 'POCs',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            uri: 'vr',
            name: 'vendor-ref',
            title: 'Vendor Reference',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        },
        {
            uri: 'de',
            name: 'debrief',
            title: 'Audit / Debrief',
            progress: '1/10',
            show: false,
            html: '/html/project-todo.html'
        }
    ];
    T.toggleTile = toggleTile;

    activate();

    function activate() {
        listenToNavEvents();
        TileLocation.load();
    }

    function listenToNavEvents() {
        $rootScope.$on('add:tile', function (evt, vals) {
            //console.log('>>> adding tiles', vals);

            angular.forEach(vals, function (v) {
                var tile = findBy('uri')(T.tiles, v)[0];
                var idx = T.tiles.indexOf(tile);
                T.tiles[idx].show = true;
            });

        });

        $rootScope.$on('remove:tile', function (evt, val) {
            //console.log('>>> removing tile', val);
            var tile = findBy('uri')(T.tiles, val)[0];
            var idx = T.tiles.indexOf(tile);
            T.tiles[idx].show = false;
        });
    }

    function toggleTile(tile, on) {
        var show = (arguments.length > 1) ? on : tile.show;
        //console.log('>>>Toggling tile: %s - %s', show, tile.uri);

        TileLocation[show ? 'add' : 'remove']('tile', tile.uri);
    }

    // TODO: to util
    function findBy(key) {
        return function (arr, val) {
            return $.map(arr, function (obj) {
                return (obj[key] !== val) ? null : obj;
            });
        };
    }

    return T;
}