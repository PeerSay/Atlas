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
    T.progressTotal = {
        max: 0,
        current: 0
    };
    T.setProgress = setProgress;
    // View mode
    T.viewMode = { value: 'norm' };
    T.toggleViewMode = toggleViewMode;


    activate();

    function activate() {
        listenToNavEvents();
    }

    function listenToNavEvents() {
        // Tiles deep-linking
        $rootScope.$on('replace:tile', function (evt, vals) {
            T.visible.tiles = [];
            angular.forEach(vals, function (uri) {
                addTile(uri);
            });
        });
        $rootScope.$on('add:tile', function (evt, vals) {
            angular.forEach(vals, function (uri) {
                addTile(uri);
            });
        });
        $rootScope.$on('remove:tile', function (evt, val) {
            removeTile(val);
        });
        // Modes deep-linking
        $rootScope.$on('replace:mode', function (evt, vals) {
            T.viewMode.value = vals[0]; // must be 1 item
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

    function addTile(uri) {
        var tile = findBy('uri')(tiles, uri)[0];

        tile.show = true;
        T.visible.tiles.push(tile);
    }

    function removeTile(uri) {
        var tile = findBy('uri')(tiles, uri)[0];
        var idx = T.visible.tiles.indexOf(tile);

        tile.show = false;
        T.visible.tiles.splice(idx, 1);
    }

    function toggleTile(tile, on) {
        var show = (arguments.length > 1) ? on : tile.show; // No negation cause negated by ng-model already
        DeepLinking[show ? 'add' : 'remove']('tile', tile.uri);
    }

    function toggleViewMode() {
        var newMode = (T.viewMode.value === 'norm') ? 'min' : 'norm';
        DeepLinking.overwrite('mode', newMode);
    }

    function setProgress(tile, progress) {
        tile.progress = progress;
        setProgressTotal();
    }

    function setProgressTotal() {
        var total = T.progressTotal;
        total.max = 0;
        total.current = 0;

        angular.forEach(T.visible.tiles, function (tile) {
            total.max += tile.progress.total;
            total.current += tile.progress.value;
        });
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