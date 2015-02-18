angular.module('PeerSay')
    .filter('capitalize', capitalize);

function capitalize() {
    return function (item) {
        item = item.toLowerCase();
        return item[0].toUpperCase() + item.substring(1);
    };
}