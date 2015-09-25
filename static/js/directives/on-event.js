angular
    .module('PeerSay')
    .directive('psOnEvent', psOnEvent);

psOnEvent.$inject = ['Util'];
function psOnEvent(_) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            var name = 'psOnEvent';
            var cache = {};

            scope.$watch(attr[name], function (newVal, oldVal) {
                if (newVal) {
                    addListeners(newVal);
                }
            });

            function addListeners(list) {
                _.forEach(list, function (func, evt) {
                    cache[evt] = function () {
                        scope.$apply(func);
                    };

                    element.on(evt, cache[evt]);
                });
            }

            function removeListeners(cache) {
                _.forEach(cache, function (func, evt) {
                    element.off(evt, func);
                });
            }


            element.on('$destroy', function () {
                removeListeners(cache);
            });
        }
    };
}
