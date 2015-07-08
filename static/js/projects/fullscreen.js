/*global angular:true*/

angular.module('PeerSay')
    .factory('FullScreen', FullScreen);

FullScreen.$inject = ['Storage'];
function FullScreen(Storage) {
    var F = {};
    var STORAGE_KEY = 'fs';

    F.on = false;
    F.toggle = toggle;

    init();

    function init() {
        F.on = Storage.get(STORAGE_KEY) || false;
    }

    function toggle() {
        F.on = !F.on;
        Storage.set(STORAGE_KEY, F.on);
    }

    return F;
}
