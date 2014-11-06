/*global angular:true*/

angular.module('peersay')
    .factory('Tiles', Tiles);

Tiles.$inject = ['$rootScope', 'DeepLinking'];
function Tiles($rootScope, DeepLinking) {
    var T = {};

    var tiles = [
        {
            uri: 'es',
            name: 'essentials',
            title: 'Project Essentials',
            html: '/html/project-essentials.html',
            progress: '1/10',
            show: false
        },
        {
            uri: 'ev',
            name: 'evaluation',
            title: 'Evaluation Requirements',
            html: '/html/project-todo.html',
            progress: '1/10',
            show: false
        },
        {
            uri: 'vi',
            name: 'vendor-input',
            title: 'Vendor Input',
            html: '/html/project-todo.html',
            progress: '1/10',
            show: false
        },
        {
            uri: 'sh',
            name: 'shortlists',
            title: 'Shortlists',
            html: '/html/project-todo.html',
            progress: '1/10',
            show: false
        },
        {
            uri: 'po',
            name: 'pocs',
            title: 'POCs',
            html: '/html/project-todo.html',
            progress: '1/10',
            show: false
        },
        {
            uri: 'vr',
            name: 'vendor-ref',
            title: 'Vendor Reference',
            html: '/html/project-todo.html',
            progress: '1/10',
            show: false
        },
        {
            uri: 'de',
            name: 'debrief',
            title: 'Audit / Debrief',
            html: '/html/project-todo.html',
            progress: '1/10',
            show: false
        }
    ];
    T.checklist = {
        tiles: []
    };
    T.visible = {
        tiles: []
    };
    T.load = load;
    T.unload = unload;
    T.toggleTile = toggleTile;

    activate();

    function activate() {
        listenToNavEvents();
    }

    function listenToNavEvents() {
        $rootScope.$on('replace:tile', function (evt, vals) {
            T.visible.tiles = [];
            angular.forEach(vals, function (v) {
                var tile = findBy('uri')(tiles, v)[0];
                tile.show = true;
                T.visible.tiles.push(tile);
            });
        });
        $rootScope.$on('add:tile', function (evt, vals) {
            angular.forEach(vals, function (v) {
                var tile = findBy('uri')(tiles, v)[0];
                tile.show = true;
                T.visible.tiles.push(tile);
            });
        });
        $rootScope.$on('remove:tile', function (evt, val) {
            var tile = findBy('uri')(tiles, val)[0];
            tile.show = false;
            var idx = tiles.indexOf(tile);
            T.visible.tiles.splice(idx, 1);
        });
    }

    function load(nspace) {
        angular.forEach(tiles, function (tile) {
            tile.show = false;
            // tile.progress = 1; TODO
            T.checklist.tiles.push(tile);
        });
        DeepLinking.load(nspace);
    }

    function unload() {
        T.checklist.tiles = [];
        T.visible.tiles = [];
        DeepLinking.unload();
    }

    function toggleTile(tile, on) {
        var show = (arguments.length > 1) ? on : tile.show; // XXX - no negation cause negated by ng-model already
        //console.log('>>>Toggling tile: %s - %s', show, tile.uri);

        DeepLinking[show ? 'add' : 'remove']('tile', tile.uri);
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