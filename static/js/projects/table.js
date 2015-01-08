/*global angular:true*/

angular.module('peersay')
    .factory('Table', Table);

Table.$inject = ['$q', '$rootScope', '$filter', 'ngTableParams', 'Backend'];
function Table($q, $rootScope, $filter, ngTableParams, Backend) {
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
    // API
    T.addView = addVIew;
    T.toData = toData;
    T.groupBy = groupBy;
    T.sortBy = sortBy;
    T.readCriteria = readCriteria;
    T.updateCriteria = updateCriteria;


    /**
     * Creates & returns new view
     * Ctrl supplied toViewData must return data as:
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
    function addVIew(id, name, toViewData) {
        views[name] = {
            toData: toViewData
        };
        return TableView(id, name, T);
    }

    function toData(projectId, name) {
        return readCriteria(projectId)
            .then(function (model) {
                return views[name].toData(model)
            });
    }

    // CRUD operations
    //

    // Attaching transform middleware
    Backend
        .use('get', ['projects', '.*?', 'criteria'], transformCriteriaModel);

    function readCriteria(id) {
        return Backend.read(['projects', id, 'criteria'])
            .then(function (res) {
                return (model = res);
            });
    }

    function updateCriteria(id, data) {
        return Backend.update(['projects', id, 'criteria'], data); // TODO
    }

    function transformCriteriaModel(data) {
        // Must have: data.criteria;
        // XXX - emul server data
        data.criteria[0].vendors = [
            {title: 'IMB', value: 1},
            {title: 'Some other', value: 0},
            {title: 'XP', value: 123}
        ];

        data.criteriaStr = JSON.stringify({ criteria: data.criteria }); //TODO - need?
        data.groups = findGroups(data.criteria);
        data.vendors = indexVendors(data.criteria);
        return data;

        function findGroups(criteria) {
            var groups = [];
            var found = {};
            angular.forEach(criteria, function (crit) {
                if (crit.group && !found[crit.group]) {
                    found[crit.group] = true;
                    groups.push(crit.group);
                }
            });
            return groups;
        }

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


    /**
     * TableView class
     * Exposed via addVIew call
     */
    var TableView = function (projectId, name, svc) {
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

            svc.toData(projectId, name)
                .then(function (data) {
                    var rows = sort(data.rows, params.orderBy());

                    V.columns = data.columns;
                    $defer.resolve(rows);
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
                V.sortBy = sortBy;
            }

            $rootScope.$on('sorting', function (evt, order) {
                V.tableParams.sorting(order);
            });
            return V;
        }

        function columnClass(col) {
            var edited = col.edit && col.edit.show;
            var sortable = V.sortBy && !col.virtual && !edited;
            // virtual is 'Add new' - not sortable
            // hide when edit too

            return {
                'sortable': sortable,
                'sort-asc': V.tableParams.isSortBy(col.field, 'asc'),
                'sort-desc': V.tableParams.isSortBy(col.field, 'desc'),
                'editable': col.editable && edited,
                'edited': edited
            };
        }

        function sortBy(col) {
            if (col.edit.show) { return; }

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

        // Edit
        function editCol(col, evt) {
            col.edit.show = true;
            col.edit.value = col.title;
            return evt.preventDefault(); // XXX - don't work?
        }

        // For html:
        //tableParams +
        //columns +
        V.columnClass = columnClass;
        V.editCol = editCol;
        V.groupBy = groupBy;
        // For ctrl:
        V.grouping = grouping;
        V.sorting = sorting;
        V.debug = debug;
        V.done = done;
        return V;
    };

    return T;
}
