/*global angular:true*/

angular.module('globals', [])
    .factory('jsonpatch', function() { return window.jsonpatch; })
    .factory('jQuery', function() { return window.$; });

angular.module('peersay', [
    'ngRoute',
    'ngMessages',
    'ngSanitize',
    'ngTable',
    'ngTableResizableColumns',
    'monospaced.elastic',
    'ng-context-menu',
    'globals'
]);
