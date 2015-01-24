/*global angular:true*/

angular.module('peersay')
    .factory('Util', Util);

function Util() {
    var U = {};
    // List
    U.forEach = angular.forEach.bind(angular);
    U.map = $.map.bind($);
    U.find = find;
    U.findWhere = findWhere;
    // Time
    U.now = getNow();
    U.timeIt = timeIt;

    var timed = {};

    /**
     * Usage:
     *  var timedFn = timeIt('some', fn, 1000);
     *  timedFn();
     *  timedFn();
     * outputs:
     *
     * */
    function timeIt(name, func, wait) {
        if (timed[name]) { return timed[name]; }

        return timed[name] = (function () {
            var lasted = 0;
            var calls = 0;
            var timeout = null;

            return function () {
                var context = this, args = arguments;
                var later = function () {
                    console.log('>> TIME: [%s] called %s times, took %sms ', name, calls, lasted);
                    lasted = 0;
                    calls = 0;
                };

                clearTimeout(timeout);
                timeout = setTimeout(later, wait);

                var start = U.now();
                var res = func.apply(context, args);

                lasted += U.now() - start;
                calls++;

                return res;
            }
        })();
    }


    function getNow() {
        return performance ? performance.now.bind(performance) :
            function () {
                return +new Date;
            };
    }

    /**
     * As Underscore's _.find
     * */
    function find(arr, iterator, context) {
        var result;
        arr.some(function (value, index, list) {
            if (iterator.call(context, value, index, list)) {
                result = value;
                return true;
            }
        });
        return result;
    }

    /**
     * As Underscore's _.findWhere
     * */
    function findWhere(arr, attrs) {
        return find(arr, function (value) {
            for (var key in attrs) {
                if (attrs[key] !== value[key]) { return false; }
            }
            return true;
        });
    }

    return U;
}