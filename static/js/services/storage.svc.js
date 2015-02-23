/*global angular:true*/

angular.module('PeerSay')
    .factory('Storage', Storage);

function Storage() {
    var S = {};
    S.get = get;
    S.set = set;
    S.remove = remove;

    function get (name) {
        var val = localStorage[name];
        return val ? JSON.parse(val) : null;
    }

    function set (name, val) {
        localStorage[name] = JSON.stringify(val);
        return val; // return plain!
    }

    function remove (name) {
        return localStorage.removeItem(name);
    }

    return S;
}