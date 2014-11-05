/*global angular:true*/

angular.module('peersay')
    .factory('TileLocation', TileLocation);

TileLocation.$inject = ['$location', '$rootScope', 'Storage'];
function TileLocation($location, $rootScope, Storage) {
    $location.load = load;
    $location.add = add;
    $location.remove = remove;
    //$location.on = remove;


    function load() {
        var stored = Storage.get('uri') || {};
        $location.search(stored); // let it parse

        angular.forEach(stored, function (v, k) {
            $rootScope.$emit('add:' + k, v.split(','));
        });
    }

    function store() {
        Storage.set('uri', $location.search());
    }

    function add(key, val) {
        var search = $location.search()[key];
        var arr = search ? search.split(',') : [];
        arr.push(val);

        $location.search(key, arr.join(','));
        $rootScope.$emit('add:' + key, [val]);
        store();
        return $location;
    }

    function remove(key, val) {
        var search = $location.search()[key];
        var arr = search ? search.split(',') : [];
        arr.splice(arr.indexOf(val), 1);

        $location.search(key, arr.join(',') || null);
        $rootScope.$emit('remove:' + key, val);
        store();
        return $location;
    }

    return $location;
}

// Usage
// 1. listen:
// TileLocation.on('tiles:add', function (names) {
//      [].concat.apply(tiles, tilesByName(names));
// });
// TileLocation.on('tiles:remove', function (name) {
//      tiles.splice(idx, 1)
// });

// TileLocation.on('dlg:add', function (names) {
//      curDlg = Dlg(names[0]).toggle(true);
// });
// TileLocation.on('dlg:remove', function () {
//     curDlg.toggle(false);
// });


// 2. onload:
// stored uri: ?tiles=es+ev
// TileLocation.load();
// -> emits: ('tiles:add', ['es', 'ev'])

// 3. on add/show tile: push?
// TileLocation.add('tiles', 'po');
// updated/stored uri: ?tiles=es+ev+po
// -> emits: ('tiles:add', ['po'])

// 4. on remove/hide
// TileLocation.remove('tiles', 'es')
// updated/stored uri: ?tiles=ev+po
// -> emits: ('tiles:remove', 'es')

// 5. on dialog open (no edit):
// TileLocation.add('dlg', 'po');
// updated/stored uri: ?tiles=ev+po&dlg=po
// -> emits ('dlg:add', ['po'])

// 6. on dialog open (edit field xxx):
// TileLocation.add('dlg', 'po|xxx');
// updated/stored uri: ?tiles=ev+po&dlg=po|xxx
// -> emits: ('dlg:add', ['po|xxx'])

// 7. on dialog close:
// TileLocation.remove('dlg');
// updated/stored uri: ?tiles=ev+po
// -> emits: ('dlg:remove')
