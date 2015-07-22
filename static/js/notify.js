/*global angular:true*/

angular.module('PeerSay')
    .factory('Notify', Notify)
    .directive('psNotify', psNotify);

Notify.$inject = ['$rootScope', '$timeout'];
function Notify($rootScope, $timeout) {
    var N = {};
    N.model = {};
    N.show = show;
    N.hide = hide;


    activate();

    function activate() {
        // Hide upon navigation
        $rootScope.$on('$stateChangeStart', hide);
    }

    function show(type, msg, options) {
        N.model = {type: type, title: msg.title, text: msg.text, show: true};

        if (options && options.hideAfter) {
            $timeout(hideAfterFn(type), options.hideAfter);
        }
    }

    function hide() {
        N.model = {};
    }

    function hideAfterFn(type) {
        return function () {
            if (type === N.model.type) {
                hide();
            }
        };
    }

    return N;
}


psNotify.$inject = [];
function psNotify() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            type: '=',
            ctl: '='
        },
        template: [
            '<div class="notify" ng-show="ctl.show && ctl.type === type">',
                '<div ng-transclude></div>',
            '</div>'
        ].join('')
    };
}
