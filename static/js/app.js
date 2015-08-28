/*global angular:true*/

angular.module('PeerSay.globals', [])
    .factory('jsonpatch', function() { return window.jsonpatch; })
    .factory('jQuery', function() { return window.$; });

angular.module('PeerSay', [
    'PeerSay.globals',
    'ui.router',
    'ngRoute', // TODO - remove?
    'ngMessages',
    'ngSanitize',
    'ngAnimate',
    'ngTable',
    'monospaced.elastic',
    'ng-context-menu',
    'ui.select',
    'ngFileUpload',
    'at.multirange-slider'
]);
