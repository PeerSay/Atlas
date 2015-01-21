/*global angular:true*/

angular.module('peersay')
    .factory('Table', Table);

Table.$inject = ['$rootScope', '$filter', 'ngTableParams', 'Backend', 'TableModel'];
function Table($rootScope, $filter, ngTableParams, Backend, TableModel) {
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
        },
        displayName: function (prop) {
            var name = {
                'null': 'none',
                'group': 'topic'
            }[prop] || prop;
            return $filter('capitalize')(name);
        }
    };
    // API
    T.addView = addVIew;
    T.toData = toData;
    T.groupBy = groupBy;
    T.sortBy = sortBy;
    T.reload = reload;
    // CRUD
    T.readCriteria = readCriteria;
    T.updateCriteria = updateCriteria;// TODO - do via patch
    T.patchCriteria = patchCriteria;


    /**
     * Creates & returns new view
     */
    function addVIew(ctrl, name, toViewData) {
        views[name] = {
            toData: toViewData
        };
        return TableView(ctrl, name, T);
    }

    function toData(projectId, name) {
        return readCriteria(projectId)
            .then(function (model) {
                return views[name].toData(model)
            });
    }

    function reload() {
        console.log('>>Table reload!');
        $rootScope.$emit('reload');
    }

    // CRUD
    //
    function transformCriteriaModel(data) {
        // data format: data.criteria = [...];
        return TableModel.buildModel(data.criteria);
    }

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
        if (!data.length) { return; }
        return Backend.patch(['projects', id, 'criteria'], data);
    }

    // Attaching transform
    Backend
        .use('get', ['projects', '.*?', 'criteria'], transformCriteriaModel);


    /**
     * TableView class
     * Exposed via addVIew call
     */
    var TableView = function (ctrl, name, svc) {
        var V = {};
        var projectId = ctrl.projectId;
        // For html:
        V.name = name;
        V.tableParams = null;
        V.columns = [];
        V.rows = [];
        V.runtimeColClass = runtimeColClass;
        V.cellClass = cellClass;
        //Edit
        V.saveColumnCell = saveColumnCell;
        V.removeColumn = removeColumn;
        V.saveCell = saveCell;
        V.removeRow = removeRow;
        V.addRowLike = addRowLike;
        V.addRowOnTab = addRowOnTab;
        // Popover
        V.popoverOn = null;
        V.topic = {
            options: TableModel.topics, // ref
            addNew: {
                show: false,
                value: ''
            },
            keyPressed: topicKeyPressed,
            doneEdit: function () {
                this.addNew = {};
                V.popoverOn = null;
            }
        };
        // For ctrl:
        V.grouping = grouping;
        V.sorting = sorting;
        V.debug = debug;
        V.done = done;

        // ngTable params
        var settings = {
            counts: [], // remove paging
            defaultSort: 'asc', // XXX
            groupBy: function () {
                return null;
            }
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
                    V.rows = data.rows;

                    $defer.resolve(rows);
                });
        }

        // Grouping
        function grouping() {
            settings.groupBy = function (row) {
                var cur = svc.groupBy.get();
                var found = $.map(row, function (cell) {
                    var model = cell.model;
                    return (model.field === cur) ? model.value : null
                })[0];
                //console.log('>>>>>groupBy [%s] returns: %s, on', cur, found, row);
                return found;
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
            if (edited) { return; } // TODO - remove

            var field = col.model.field;
            var order = {};
            order[field] = V.tableParams.isSortBy(field, 'asc') ? 'desc' : 'asc';

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
        function runtimeColClass(col) {
            var edited = col.edited;
            var sortable = V.sortBy && col.sortable && !edited;

            return {
                'sortable': sortable,
                'sort-asc': V.tableParams.isSortBy(col.model.field, 'asc'),
                'sort-desc': V.tableParams.isSortBy(col.model.field, 'desc'),
                'editable': col.editable,
                'edited': edited,
                'last': col.last && !edited
            };
        }

        function cellClass(cell) {
            var res = {
                edited: cell.edited
            };
            if (cell.type) {
                res[cell.type] = true;
            }
            return res;
        }

        // Popover
        function topicKeyPressed(model, evt) {
            if (evt.keyCode === 13) {
                if (this.addNew.value) {
                    model.value = this.addNew.value;
                    saveCell(model);
                }
                this.doneEdit();
                return;
            }
            if (evt.keyCode === 27) {
                this.doneEdit();
                return evt.preventDefault();
            }
        }

        // Edit
        function saveColumnCell(model) {
            var isAddNew = (model.id === 'new');
            // TODO - validity

            var res;
            if (isAddNew) {
                res = TableModel.addColumn(model.value);
            }
            else {
                res = TableModel.saveColumn(model);
            }

            svc.patchCriteria(projectId, res.patches);
            if (res.needReload) {
                svc.reload();
            }
        }

        function saveCell(cell) {
            var res = TableModel.saveCell(cell);
            svc.patchCriteria(projectId, res.patches);
            if (res.needReload) {
                svc.reload();
            }
        }

        function removeColumn(model) {
            var res = TableModel.removeColumn(model);
            svc.patchCriteria(projectId, res.patches);
            svc.reload();
        }

        function removeRow(model) {
            var res = TableModel.removeRow(model);
            svc.patchCriteria(projectId, res.patches);
            svc.reload();
        }

        function addRowLike(model) {
            // find last criteria in group
            var prevModel = model, nextRow;
            while (nextRow = TableModel.nextRowLike(prevModel, getAlikePredicate(model))) {
                prevModel = nextRow[0];
            }

            var res = TableModel.addRowLike(prevModel);
            svc.patchCriteria(projectId, res.patches);
            reloadUnsorted();
        }

        function addRowOnTab(model) {
            var added = false;
            var lastCol = (model.field === 'description');

            if (lastCol) {
                var nextRow = TableModel.nextRowLike(model, getAlikePredicate(model));
                if (!nextRow) {
                    var res = TableModel.addRowLike(model);
                    svc.patchCriteria(projectId, res.patches);
                    reloadUnsorted();
                    added = true;
                }
            }
            return added;
        }

        function getAlikePredicate(model) {
            var groupedBy = T.groupBy.get();
            var predicate = !groupedBy ? null : {
                key: groupedBy,
                value: model.criteria[groupedBy] // No vendors!
            };
            return predicate;
        }

        function reloadUnsorted() {
            var sortBy = svc.sortBy.get();
            svc.sortBy.set({}); // causes reload only if sorted already
            if (!Object.keys(sortBy).length) {
                svc.reload();
            }
        }

        return V;
    };

    return T;
}
