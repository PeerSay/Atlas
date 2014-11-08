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
            progress: {},
            show: false
        },
        {
            uri: 'ev',
            name: 'evaluation',
            title: 'Evaluation Requirements',
            html: '/html/project-todo.html',
            progress: {},
            show: false
        },
        {
            uri: 'vi',
            name: 'vendor-input',
            title: 'Vendor Input',
            html: '/html/project-todo.html',
            progress: {},
            show: false
        },
        {
            uri: 'sh',
            name: 'shortlists',
            title: 'Shortlists',
            html: '/html/project-todo.html',
            progress: {},
            show: false
        },
        {
            uri: 'po',
            name: 'pocs',
            title: 'POCs',
            html: '/html/project-todo.html',
            progress: {},
            show: false
        },
        {
            uri: 'vr',
            name: 'vendor-ref',
            title: 'Vendor Reference',
            html: '/html/project-todo.html',
            progress: {},
            show: false
        },
        {
            uri: 'de',
            name: 'debrief',
            title: 'Audit / Debrief',
            html: '/html/project-todo.html',
            progress: {},
            show: false
        }
    ];
    T.checklist = {
        tiles: [],
        current: null
    };
    T.visible = {
        tiles: []
    };
    T.load = load;
    T.unload = unload;
    T.toggleTile = toggleTile;
    // Progress
    T.setProgress = setProgress;
    T.progressTotal = {
        max: 0,
        current: 0
    };

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
            var idx = T.visible.tiles.indexOf(tile);
            T.visible.tiles.splice(idx, 1);
        });
    }

    function load(nspace) {
        angular.forEach(tiles, function (tile) {
            tile.show = false;
            T.checklist.tiles.push(tile);
        });
        T.checklist.current = T.checklist.tiles[0]; //TODO
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
    
    function setProgress(uri, progress) {
        var tile = findBy('uri')(tiles, uri)[0];
        tile.progress = progress;

        T.progressTotal.max += progress.total;
        T.progressTotal.current += progress.value;
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