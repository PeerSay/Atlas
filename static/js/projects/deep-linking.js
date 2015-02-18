/*global angular:true*/

angular.module('PeerSay')
    .factory('DeepLinking', DeepLinking);

/**
 * Usage:
 * 1. Listen to events
 *  $rootScope.$on('tiles:replace', function (names) {
 *      // show only [names] tiles
 *  });
 *  $rootScope.$on('tiles:add', function (names) {
 *      // +show [names] tiles
 *  });
 *  $rootScope.$on('tiles:remove', function (name) {
 *      // hide tile
 *  });
 *
 * 2. Load uri upon nav
 *  DeepLinking.load(namespace);
 *  -> loads from storage if exists
 *  -> emits ('tiles:replace', ['es', 'ev'])
 *
 * 3. On add (e.g. show tile)
 *  TileLocation.add('tiles', 'po');
 *  -> updates uri/storage: ?tiles=es+ev+po
 *  -> emits: ('tiles:add', ['po'])
 *
 * 4. On remove (e.g. hide tile)
 *  DeepLinking.remove('tiles', 'es')
 *  -> updates uri/storage: ?tiles=ev+po
 *  -> emits: ('tiles:remove', 'es')
 *
 * 5. On ctrl unload
 *  DeepLinking.unload();
 */

DeepLinking.$inject = ['$location', '$rootScope', 'Storage', 'Util'];
function DeepLinking($location, $rootScope, Storage, _) {
    var namespace, paths;

    $location.load = load;
    $location.unload = unload;
    $location.add = add;
    $location.remove = remove;
    $location.overwrite = overwrite; // replace exists

    $rootScope.$on('$routeUpdate', function () {
        load(namespace, paths);
    });

    function load(_namespace, _paths) {
        namespace = _namespace;
        paths = _paths;

        var search = $location.search();
        if (Object.keys(search).length) {
            store();
        }
        else {
            search = restore();
            if (Object.keys(search).length) {
                $location
                    .search(search)
                    .replace(); // prevent Back btn after load
            }
        }
        //console.log('>> Loaded search for [%s]', namespace, search);

        _.forEach(paths, function (path) {
            var val = search[path];
            val = val ? val.split(',') : [null];

            // TODO: emit only on change
            $rootScope.$emit('replace:' + path, val);
        });
    }

    function unload() {
        namespace = null;
    }

    function store() {
        Storage.set(namespace, $location.search());
    }

    function restore() {
        return Storage.get(namespace) || {};
    }

    function add(key, val) {
        var search = $location.search()[key];
        var arr = search ? search.split(',') : [];

        if (arr.indexOf(val) < 0) { // ignore duplicates
            arr.push(val);

            $location
                .search(key, arr.join(','));

            $rootScope.$emit('add:' + key, [val]);
            store();
        }
        return $location;
    }

    function remove(key, val) {
        var search = $location.search()[key];
        var arr = search ? search.split(',') : [];
        arr.splice(arr.indexOf(val), 1);

        $location
            .search(key, arr.join(',') || null);

        $rootScope.$emit('remove:' + key, val);
        store();
        return $location;
    }

    function overwrite(key, val) {
        $location
            .search(key, val);

        $rootScope.$emit('replace:' + key, [val]); // arr to unify with event sent on load
        store();
        return $location;
    }

    return $location;
}
