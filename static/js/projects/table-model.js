// Can be used on both client and server, thus declared as either Angular
// or CommonJS module, depending on environment

(function (global, factory) {
    if (global.angular) {
        angular.module('PeerSay')
            .factory('TableModel', factory);
    }
    else if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    }
})(this, TableModel);


function TableModel() {
    var T = {};
    var ranges = Ranges();
    T.model = {};
    T.build = build;
    T.range = range;
    // Functional
    T._get = _get;
    T._val = _val;
    T._sum = _sum;
    T._div = _div;
    T._max = _max;

    reset();

    function build(fn) {
        reset();
        fn(T);
        return T.model;
    }

    function reset() {
        ranges.reset();
        T.header = range('header').access;
        T.footer = range('footer').access;
        T.rows = range('rows', {multi: true});
    }

    function range(name, params) {
        if (params && params.multi) {
            return function (idx, params) {
                var innerKey = name + ':' + idx;
                if (!range(name).access(idx)) {
                    range(name).push(innerKey, ranges.get(innerKey));
                }
                return range(innerKey, params);
            }
        }
        else {
            return ranges.get(name).extend(params || {});
        }
    }

    function Ranges() {
        var S = {};
        S.get = get;
        S.reset = reset;
        var cache = {};

        function get(name) {
            return cache[name] = cache[name] || Range(name)
        }

        function reset() {
            cache = {};
        }

        function Range(name) {
            var R = {};
            R.name = name;
            R.list = [];
            R.skip = skip;
            R.size = size;
            R.push = addItem;
            R.aggregate = addAggrs;
            R.access = T.model[name] = access;
            R.extend = extend;
            var map = {};

            function access(key) {
                if (arguments.length < 1) { return R; }
                if (typeof key === 'number') { return R.list[key]; }
                if (typeof key === 'string') { return map[key]; }
                return null;
            }

            function skip(idx) {
                return R.list.slice(idx);
            }

            function addItem(key, data, refsMap) {
                var item = map[key];
                if (!item) {
                    key = key || String(R.list.length);
                    item = map[key] = id(data);
                    R.list.push(item);
                }
                item.data = data;

                addRefs(item.data, refsMap || {});
                return R;
            }

            function addRefs(data, refsMap) {
                for (var prop in refsMap) {
                    var ref = refsMap[prop];
                    addRef.apply(null, [data, prop].concat(ref.split('=')));
                }
            }

            function addRef(data, prop, rangeName, aggrName) {
                data[prop] = (rangeName ? ranges.get(rangeName) : R)[aggrName];
            }

            function addAggrs(aggrMap) {
                extend(aggrMap, function (aggr) {
                    return function (param) {
                        return arguments.length < 1 ? aggr(R) : aggr(R)(param);
                    };
                });
                return R;
            }

            function extend(map, fn) {
                Object.keys(map).forEach(function (prop) {
                    R[prop] = fn ? fn(map[prop]) : map[prop];
                });
                return R;
            }

            function id(data) {
                // if data is Range then return its access fn
                return data.access || function () {
                    return data;
                }
            }

            function size() {
                return R.list.length;
            }

            return R;
        }

        return S;
    }

    // Aggregates
    //

    function _val(param) {
        return (typeof param === 'function') ? param :
            function (obj) { return obj[param]; };
    }

    function _sum(val) {
        val = val || _val('value');
        return function (range) {
            return range.list.reduce(function (acc, cur) {
                return acc + val(cur());
            }, 0);
        }
    }

    function _max(val) {
        val = val || _val('value');
        return function (range) {
            return range.list.reduce(function (acc, cur) {
                var v = val(cur());
                return v > acc ? v : acc;
            }, 0);
        }
    }

    /////////////////////////////
    function _get(val) {
        val = val || _val('value');
        return function (range) {
            return function (idx) {
                return val(range.access(idx)());
            }
        }
    }

    function _div(getter, val) {
        val = val || _val('value');
        return function (range) {
            return function (idx) {
                return getter(range)(idx) / val(range)();
            }
        }
    }

    return T;
}