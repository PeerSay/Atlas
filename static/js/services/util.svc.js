/*global angular:true*/

angular.module('PeerSay')
    .factory('Util', Util);

Util.$inject = ['jQuery', '$state'];
function Util($, $state) {
    var U = {};
    // Functional
    U.forEach = angular.forEach.bind(angular);
    U.map = $.map.bind($);
    U.find = find;
    U.findWhere = findWhere;
    U.filter = filter;
    U.removeItem = removeItem;
    U.noop = noop;
    // Time
    U.now = getNow();
    U.timeIt = timeIt;
    U.stateDbg = stateDbg;
    //Constants
    U.const = {
        http: {
            NOT_AUTHORIZED: 401,
            CONFLICT: 409
        }
    };

    var timed = {};

    /**
     * Usage:
     *  var timedFn = timeIt('some', fn, 1000);
     *  timedFn();
     *  timedFn();
     *
     * After 1s outputs:
     *  PERF: [some] called 2 times, took 0.123ms
     *
     * @param wait - if no calls to timedFn were done after last call for [wait]ms,
     *               then sampling ends and result is written to console.
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
                    console.log('>> PERF: [%s] called %s times, took %sms ', name, calls, lasted);
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
            };
        })();
    }


    function getNow() {
        return window.performance ? performance.now.bind(performance) :
            function () {
                return new Date().getTime();
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

    /**
     * As Underscore's _.filter
     * */
    function filter(obj, predicate, context) {
        var results = [];
        U.forEach(obj, function(value, index, list) {
            if (predicate.call(context, value, index, list)) {
                results.push(value);
            }
        });
        return results;
    }

    /**
     * Removes item from array
     * */
    function removeItem(arr, item) {
        var idx = arr.indexOf(item);
        if (idx >= 0) {
            arr.splice(idx, 1);
        }
        return item;
    }

    /**
     * Noop
     * */
    function noop() {}

    /**
     * Debug utility: logging wrapper for ui-router $state.go()
     * */
    function stateDbg(toStateName, params, options) {
        console.log('>> Loading [%s]...', toStateName);

        return $state.go(toStateName, params, options)
            .then(function () {
                console.log('>>>> [%s] loaded, state:', toStateName, $state.current);
            })
            .catch(function (res) {
                console.log('>>>> [%s] FAILED:', toStateName, res);
            });
    }

    return U;
}
