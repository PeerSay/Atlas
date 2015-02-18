/*global angular:true*/

angular.module('PeerSay')
    .factory('Tiles', Tiles);

Tiles.$inject = ['$rootScope', 'DeepLinking', 'Util'];
function Tiles($rootScope, DeepLinking, _) {
    var T = {};

    var tiles = [
        {
            uri: 'es',
            name: 'essentials',
            title: 'Project Essentials',
            html: '/html/project-essentials.html',
            show: false
        },
        {
            uri: 'ev',
            name: 'evaluation',
            title: 'Evaluation Requirements',
            html: '/html/project-requirements.html',
            show: false
        },
        {
            uri: 'vi',
            name: 'vendor-input',
            title: 'Product Input',
            html: '/html/project-vendors.html',
            show: false
        },
        {
            uri: 'sh',
            name: 'shortlists',
            title: 'Shortlists',
            html: '/html/project-shortlist.html',
            show: false
        }
    ];
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
    // Full view dlg
    T.fullView = {
        dlg: null,
        control: null
    };
    T.toggleFullView = toggleFullView;


    activate();

    function activate() {
        listenToNavEvents();

        T.visible.tiles = tiles;
    }

    function listenToNavEvents() {
        // Tiles deep-linking
        $rootScope.$on('replace:tile', function (evt, vals) {
            _.forEach(vals, function (uri) {
                if (uri) { addTile(uri); }
            });
        });
        $rootScope.$on('add:tile', function (evt, vals) {
            _.forEach(vals, function (uri) {
                addTile(uri);
            });
        });
        $rootScope.$on('remove:tile', function (evt, val) {
            removeTile(val);
        });
        // Full view deep-linking
        $rootScope.$on('replace:dlg', function (evt, arr) {
            var vals = arr[0];  // comes as ['dlg-ctl'] or [null]
            if (!vals) {
                T.fullView.dlg = null;
                T.fullView.control = null;
            }
            else {
                vals = vals.split('-');
                T.fullView.dlg = vals[0];
                T.fullView.control = vals[1] || null;
            }
        });
    }

    function load(nspace) {
        _.forEach(tiles, function (tile) {
            tile.show = false;
        });
        DeepLinking.load(nspace, ['tile', 'mode', 'dlg']);
    }

    function unload() {
        T.visible.tiles = [];
        DeepLinking.unload();
    }

    function addTile(uri) {
        var tile = _.findWhere(tiles, { uri: uri });
        tile.show = true;
    }

    function removeTile(uri) {
        var tile = _.findWhere(tiles, { uri: uri });
        tile.show = false;
    }

    function toggleTile(tile, on) {
        var show = (arguments.length > 1) ? on : tile.show; // No negation cause negated by ng-model already
        DeepLinking[show ? 'add' : 'remove']('tile', tile.uri);
    }

    function toggleFullView(on, dlg, control) {
        if (on) {
            var vals = [dlg];
            if (control) {
                vals.push(control);
            }
            DeepLinking.overwrite('dlg', vals.join('-'));
        }
        else {
            DeepLinking.overwrite('dlg', null);
        }
    }

    // TODO
    function setProgressTotal() {
        var total = T.progressTotal;
        total.max = 100;
        total.current = 25;
    }

    return T;
}