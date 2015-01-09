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
    T.reload = reload;
    // edit
    T.readCriteria = readCriteria;
    T.updateCriteria = updateCriteria;
    T.saveColumn = saveColumn;
    T.addColumn = addColumn;
    T.saveCell = saveCell;

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

    function reload() {
        $rootScope.$emit('reload');
    }

    // CRUD operations
    //
    function saveColumn(col) {
        // col format: { title: 'IBM', field: 'IBM', visible: true, ...}
        // col.title -- new value

        // { "op": "replace", "path": "/criteria/vendors/12/title", "value": "foo" }
        var patch = [];
        var newVal = col.title;

        // update vendor in every criteria
        angular.forEach(model.criteria, function (crit, i) {
            var vendor = crit.vendorsIndex[col.field];
            var vendorIdx = crit.vendors.indexOf(vendor);
            if (vendor) {
                // update model -- so that on next toData it is correctly read
                vendor.title = newVal;

                // create patch for server
                patch.push({
                    op: 'replace',
                    path: ['/criteria', i, 'vendors', vendorIdx, 'title'].join('/'),
                    value: newVal
                });
            }
        });

        console.log('Save column: patch:', JSON.stringify(patch));

        // TODO - save to server
    }

    function addColumn(newVal) {
        var patch = [];
        var criteria = model.criteria[0];

        // Add empty vendor to first criteria
        patch.push(addVendor(criteria, newVal, ''));
        console.log('Add column: patch:', JSON.stringify(patch));

        // TODO - save to server

        //
        model.vendors.push({ title: newVal });
        reload();
    }

    function saveCell(cell) {
        // cell format: { field: 'IMB', type: 'number', value: '123' }
        // value -- new value
        var patch = [];
        var newVal = cell.value;
        var criteria = cell.criteria;
        var criteriaIdx = model.criteria.indexOf(criteria);
        var vendor = criteria.vendorsIndex[cell.field];
        var vendorIdx = criteria.vendors.indexOf(vendor);

        if (vendor && vendor.value !== newVal) {
            vendor.value = newVal;

            patch.push({
                op: 'replace',
                path: ['/criteria', criteriaIdx, 'vendors', vendorIdx, 'value'].join('/'),
                value: newVal
            });
            console.log('Save exist cell: patch:', JSON.stringify(patch));
        }
        else if (!vendor && newVal) { // XXX - zero value!
            patch.push(addVendor(criteria, cell.field, newVal));
            console.log('Save new cell: patch:', JSON.stringify(patch));
        }

        // TODO - save to server
    }

    function addVendor(criteria, field, val) {
        var criteriaIdx = model.criteria.indexOf(criteria);
        var newVendor = {
            title: field,
            value: val
        };
        criteria.vendors.push(newVendor);
        criteria.vendorsIndex[field] = newVendor;

        // patch
        return {
            op: 'add',
            path: ['/criteria', criteriaIdx, 'vendors', '-'].join('/'),
            value: newVendor
        };
    }

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
        // data format: data.criteria = [...];

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
            var allVendors = [];
            var allIndex = {};
            angular.forEach(criteria, function (crit) {
                // Index for fast access:
                // [ {title: 'IMB', value: 1}, ...] -> {'IBM': <ref>, ...}
                crit.vendorsIndex = {};
                crit.vendors = crit.vendors || []; // may not exist

                angular.forEach(crit.vendors, function (vendor) {
                    crit.vendorsIndex[vendor.title] = vendor;

                    if (!allIndex[vendor.title]) {
                        allIndex[vendor.title] = true;
                        allVendors.push({ title: vendor.title }); // TODO - order matters!
                    }
                });
            });
            return allVendors;
        }
    }


    /**
     * TableView class
     * Exposed via addVIew call
     */
    var TableView = function (projectId, name, svc) {
        var V = {};
        // For html:
        V.tableParams = null;
        V.columns  = null;
        V.columnClass = columnClass;
        V.editColumnCell = editColumnCell;
        V.saveColumnCell = saveColumnCell;
        V.addColumn = svc.addColumn.bind(svc);
        V.saveCell = svc.saveCell.bind(svc);
        V.groupBy = groupBy;
        // For ctrl:
        V.grouping = grouping;
        V.sorting = sorting;
        V.debug = debug;
        V.done = done;

        // ngTable params
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

            $rootScope.$on('reload', function () {
                V.tableParams.reload();
            });
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
            var edited = col.edit && col.edit.show;
            if (edited) { return; }

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
        function editColumnCell(col) {
            col.edit.show = true;
            col.edit.value = !col.virtual ? col.title : ''; // virtual is AddNew
            //return evt.preventDefault(); // XXX - don't work?
        }

        function saveColumnCell(col) {
            col.edit.show = false;
            var isNew = (col.title === '...'  && !col.field);

            if (isNew) {
                if (col.edit.value) {
                    svc.addColumn(col.edit.value);
                }
            }
            else if (col.title !== col.edit.value) {
                col.title = col.edit.value;
                svc.saveColumn(col);
            }
        }

        return V;
    };

    return T;
}
