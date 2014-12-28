/*global angular:true*/

angular.module('peersay')
    .factory('Table', Table);

Table.$inject = ['$q', '$rootScope', '$filter', 'ngTableParams', 'Projects'];
function Table($q, $rootScope, $filter, ngTableParams, Projects) {
    var T = {};
    var views = {};
    var model = {};
    var sortBy = {
        current: {},
        get: function () {
            return this.current;
        },
        set: function (order) {
            this.current = order;
            // TODO: change url
            $rootScope.$emit('sorting', order);
        }
    };
    var groupBy = {
        options: [null, 'group', 'priority'],
        current: 'group',
        get: function () {
            return this.current;
        },
        set: function (prop) {
            this.current = prop;
            //TODO: url
            $rootScope.$emit('grouping', prop);
        }
    };
    var loadQ = null;

    /** Creates & returns new view
     *  toViewData must return data as:
     * {
     *  columns: [
     *   { title: 'Name', field: 'name'},
     *   { title: 'Name other', field: 'name2'}
     *  ],
     *  rows: [
     *   {'name': val1, 'name2':val2},
     *   {'name': val3, 'name2':val4},
     *   ...
     *  ]
     * }
     */
    function addVIew(name, toViewData) {
        views[name] = {
            toData: toViewData
        };
        return TableView(name, T);
    }

    function toData(name) {
        //return views[name].toData(model);
        var id = 'VsAG1Aqg'; // TODO
        if (!loadQ) {
            loadQ = $q.defer();

            readModel(id)
                .then(function () {
                    loadQ.resolve(model);
                });
        }
        return loadQ.promise;
    }

    /**
     * CRUD operations
     * */
    function readModel(projectId) {
        return Projects.readProjectCriteria(projectId)
            .then(function (res) {
                model.criteria = res.criteria;
                // XXX - emul server data
                model.criteria[0].vendors = [
                    {title: 'IMB', value: 1},
                    {title: 'Some other', value: 0},
                    {title: 'XP', value: 123}
                ];

                model.criteriaStr = JSON.stringify({ criteria: model.criteria });
                model.vendors = indexVendors(model.criteria);
            });

        function indexVendors(criteria) {
            var vendors = []; // all vendors
            var index = {};
            angular.forEach(criteria, function (crit) {
                // Index for fast access:
                // [ {title: 'IMB', value: 1}, ...] -> {'IBM': 1, ...}
                crit.vendorsIndex = {};
                crit.vendors = crit.vendors || []; // may not exist

                angular.forEach(crit.vendors, function (vendor) {
                    crit.vendorsIndex[vendor.title] = vendor.value;

                    if (!index[vendor.title]) {
                        index[vendor.title] = true;
                        vendors.push({ title: vendor.title }); // TODO - order matters!
                    }
                });
            });
            return vendors;
        }
    }


    // Exposed via addVIew call
    //
    var TableView = function (name, svc) {
        var V = {};
        var settings = {
            counts: [], // remove paging
            defaultSort: 'asc' // DBG
        };
        var parameters = {
            count: 2 // must be at least one prop different form defaults!
        };

        function debug() {
            settings.debugMode = true;
            return V;
        }

        function done() {
            settings.getData = getData;
            V.tableParams = new ngTableParams(parameters, settings);
            return V;
        }

        function getData($defer, params) {
            console.log('>>>>>getData: name=%s, order=', name, params.orderBy());

            svc.toData(name)
                .then(function (model) {
                    var data = views[name].toData(model);
                    V.columns = data.columns;

                    data.rows = sort(data.rows, params.orderBy());
                    $defer.resolve(data.rows);
                });
        }

        // Grouping
        function grouping() {
            settings.groupBy = function (item) {
                return item[svc.groupBy.get()];
            };

            $rootScope.$on('grouping', function () {
                V.tableParams.reload();
            });
            return V;
        }

        function groupBy(prop) {
            svc.groupBy.set(prop);
        }

        // Sorting
        function sorting(options) {
            parameters.sorting = svc.sortBy.get();

            if (options.active) {
                // expose to html
                V.sortingClass = sortingClass;
                V.sortBy = sortBy;
            }

            $rootScope.$on('sorting', function (evt, order) {
                V.tableParams.sorting(order);
            });
            return V;
        }

        function sortingClass(col) {
            return {
                'sortable': true,
                'sort-asc': V.tableParams.isSortBy(col.field, 'asc'),
                'sort-desc': V.tableParams.isSortBy(col.field, 'desc')
            };
        }

        function sortBy(col) {
            var order = {};
            order[col.field] = V.tableParams.isSortBy(col.field, 'asc') ? 'desc' : 'asc';

            svc.sortBy.set(order);
        }

        function sort(arr, orderByArr) {
            //orderByArr format: ['+fld1', '-fld2']
            //console.log('>>>>>sort: orderBy:', orderByArr);

            if (settings.groupBy) {
                // if grouped, sort by group first
                var orderBy = orderByArr[0];
                var curGroupBy = svc.groupBy.get();
                var sortedByGroup = orderBy && (orderBy.substring(1) === curGroupBy);
                if (!sortedByGroup && curGroupBy) {
                    orderByArr.unshift(curGroupBy);
                }
            }

            return $filter('orderBy')(arr, orderByArr);
        }

        // For html:
        //tableParams +
        //columns +
        //sortingClass() +
        //sortBy() +
        //groupBy()
        V.groupBy = groupBy;
        //
        // For ctrl:
        V.grouping = grouping;
        V.sorting = sorting;
        V.debug = debug;
        V.done = done;
        return V;
    };

    // API
    T.addView = addVIew;
    T.toData = toData;
    T.groupBy = groupBy;
    T.sortBy = sortBy;
    return T;
}
