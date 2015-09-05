/*global angular:true*/

angular.module('PeerSay')
    .factory('StorageRecord', StorageRecord);

StorageRecord.$inject = ['Storage'];
function StorageRecord(Storage) {
    var R = {};
    var booleans = {};

    function boolean(key) {
        return booleans[key] = booleans[key] || Boolean(key);
    }

    function Boolean(key) {
        var B = {};
        B.on = false;
        B.toggle = toggle;

        init();

        function init() {
            B.on = Storage.get(key) || false;
        }

        function toggle() {
            B.on = !B.on;
            Storage.set(key, B.on);
        }
        return B;
    }

    // API
    R.boolean = boolean;
    return R;
}
