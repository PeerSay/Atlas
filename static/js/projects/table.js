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
    T.saveColumnModel = saveColumnModel;
    T.addColumnModel = addColumnModel;
    T.saveCellModel = saveCellModel;

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
    function saveColumnModel(col, projectId) {
        // col format: { title: 'IBM', field: 'IBM', visible: true, ...}
        var newVal = col.title;
        var oldVal = col.field;
        var patches = [];

        // update vendor in model.vendors
        angular.forEach(model.vendors, function (vend) {
            if (vend.title === oldVal) {
                vend.title = newVal;
            }
        });

        // update vendor in every criteria
        angular.forEach(model.criteria, function (crit, i) {
            var vendor = crit.vendorsIndex[oldVal];
            var vendorIdx = crit.vendors.indexOf(vendor);
            if (vendor) {
                // update model -- so that on next toData it is correctly read
                vendor.title = newVal;
                //update index:
                crit.vendorsIndex[newVal] = vendor;
                delete crit.vendorsIndex[oldVal];

                // create patch for server
                patches.push({
                    op: 'replace',
                    path: ['/criteria', i, 'vendors', vendorIdx, 'title'].join('/'),
                    value: newVal
                });
            }
        });

        console.log('Save column: patch:', JSON.stringify(patches));
        if (patches.length) {
            patchCriteria(projectId, patches);
        }

        reload();
    }

    function addColumnModel(newVal, projectId) {
        var criteria = model.criteria[0];
        var patches = [];

        // Add empty vendor to first criteria
        patches.push(addVendor(criteria, newVal, ''));
        console.log('Add column: patch:', JSON.stringify(patches));

        // Update vendors model
        model.vendors.push({ title: newVal });

        patchCriteria(projectId, patches);
        reload();
    }

    function saveCellModel(cell, projectId) {
        // cell format: { field: 'IMB', type: 'number', value: '123' }
        var newVal = cell.value;
        var criteria = cell.criteria;
        var criteriaIdx = model.criteria.indexOf(criteria);
        var vendor = criteria.vendorsIndex[cell.field];
        var vendorIdx = criteria.vendors.indexOf(vendor);
        var patches = [];

        if (vendor && vendor.value !== newVal) {
            vendor.value = newVal;

            patches.push({
                op: 'replace',
                path: ['/criteria', criteriaIdx, 'vendors', vendorIdx, 'value'].join('/'),
                value: newVal
            });
            console.log('Save exist cell: patch:', JSON.stringify(patches));
        }
        else if (!vendor) {
            patches.push(addVendor(criteria, cell.field, newVal));
            console.log('Save new cell: patch:', JSON.stringify(patches));
        }

        if (patches.length) {
            patchCriteria(projectId, patches);
        }
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

    function patchCriteria(id, data) {
        return Backend.patch(['projects', id, 'criteria'], data);
    }

    function transformCriteriaModel(data) {
        // data format: data.criteria = [...];
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
            // format: [ {title: 'IMB'}, ... ]
            var allVendors = [];
            var allIndex = {};
            angular.forEach(criteria, function (crit) {
                // vendors format:  [ {title: 'IMB', value: 1}, ...]
                crit.vendors = crit.vendors || []; // may not exist
                // Index for fast access: {'IBM': <ref-to-vendor>, ...}
                crit.vendorsIndex = {};

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
        V.columns = null;
        V.columnClass = columnClass;
        V.editColumnCell = editColumnCell;
        V.saveColumnCell = saveColumnCell;
        V.saveCell = saveCell;
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
            //console.log('>>>>>getData: name=%s, order=', name, params.orderBy());

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
                var cur = svc.groupBy.get();
                var res = (item[cur] || {}).value;
                //console.log('>>>>>groupBy [%s] returns: ', cur, res);
                return res;
            };

            $rootScope.$on('grouping', function () {
                V.tableParams.reload();
            });
            return V;
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

        function sortBy(col) {
            var edited = col.edit && col.edit.show;
            if (edited) { return; }

            var order = {};
            order[col.field] = V.tableParams.isSortBy(col.field, 'asc') ? 'desc' : 'asc';

            svc.sortBy.set(order);
        }

        function sort(arr, orderByParam) {
            //orderByArr format: ['+fld1', '-fld2']
            //console.log('>>>>>sort: orderByParam:', orderByParam);
            var orderBy = orderByParam[0];
            if (orderBy) {
                // TODO - fix Product names with space
                orderBy = [orderBy + '.value'];

                //console.log('>>>>>sort by: ', orderBy);
            }

            // TODO - groups
            /*if (settings.groupBy) {
                // if grouped, sort by group first
                var curGroupBy = svc.groupBy.get();
                var sortedByGroup = orderBy && (orderBy.substring(1) === curGroupBy);
                if (!sortedByGroup && curGroupBy) {
                    orderByParam.unshift(curGroupBy);
                }
            }*/

            return orderBy ? $filter('orderBy')(arr, orderBy) : arr;
        }

        // Class
        function columnClass(col) {
            var edited = col.edit && col.edit.show;
            var sortable = V.sortBy && col.sortable && !edited;

            return {
                'sortable': sortable,
                'sort-asc': V.tableParams.isSortBy(col.field, 'asc'),
                'sort-desc': V.tableParams.isSortBy(col.field, 'desc'),
                'editable': !!col.edit,
                'edited': edited,
                'add-new': col.addNew && !edited
            };
        }

        // Edit
        function editColumnCell(col) {
            col.edit.show = true;
            col.edit.value = !col.addNew ? col.title : '';
            //return evt.preventDefault(); // XXX - don't work?
        }

        function saveColumnCell(col) {
            var isAddNew = !!col.addNew;
            var modified = isAddNew ? !!col.edit.value : (col.title !== col.edit.value);

            col.edit.show = false;

            if (isAddNew && modified) {
                svc.addColumnModel(col.edit.value, projectId);
            }
            else if (modified) {
                col.title = col.edit.value;
                svc.saveColumnModel(col, projectId);
            }
        }

        function saveCell(cell) {
            var modified = !!cell.value; // TODO: 0 as value!
            if (modified) {
                svc.saveCellModel(cell, projectId);
            }
        }

        return V;
    };

    return T;
}
