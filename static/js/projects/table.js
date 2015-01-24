/*global angular:true*/

angular.module('peersay')
    .factory('Table', Table);

Table.$inject = ['$rootScope', '$filter', 'ngTableParams', 'Backend', 'TableModel', 'Util'];
function Table($rootScope, $filter, ngTableParams, Backend, TableModel, _) {
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
        options: [null, 'topic', 'priority'],
        current: 'topic',
        get: function () {
            return this.current;
        },
        set: function (prop) {
            this.current = prop;
            //TODO: url
            $rootScope.$emit('grouping', prop);
        },
        displayName: function (prop) {
            var name = prop || 'none';
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
            //toData: _.timeIt('toData-' + name, toViewData, 1000)
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
        //V.sort = _.timeIt('sort', sort, 1000);
        V.sort = sort;
        //Edit
        V.validateColumnCell = validateColumnCell;
        V.saveColumnCell = saveColumnCell;
        V.removeColumn = removeColumn;
        V.saveCell = saveCell;
        V.removeRow = removeRow;
        V.addRowLike = addRowLike;
        V.addRowOnTab = addRowOnTab;
        V.addEmptyRow = addEmptyRow;
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

        function getData($defer) {
            svc.toData(projectId, name)
                .then(function (data) {
                    var rows = V.sort(data.rows);

                    V.columns = data.columns;
                    V.rows = rows; // TODO - revise

                    $defer.resolve(rows);
                });
        }

        // Grouping
        function grouping() {
            settings.groupBy = group;

            $rootScope.$on('grouping', function () {
                V.tableParams.reload();
            });
            return V;
        }

        function group(row) {
            var cur = svc.groupBy.get();
            var found = _.map(row, function (cell) {
                var model = cell.model;
                return (model.field === cur) ? model.value : null
            });
            //console.log('>>>>>groupBy [%s] returns: %s, on', cur, found, row);
            return found[0];
        }

        // Sorting
        function sorting(options) {
            parameters.sorting = svc.sortBy.get();

            if (options.active) {
                // expose to html
                V.sortBy = sortBy;
            }

            $rootScope.$on('sorting', function (evt, order) {
                V.tableParams.sorting(order); // causes reload if order differs
            });
            return V;
        }

        function sortBy(col) {
            var field = col.model.field;
            var order = {};
            order[field] = V.tableParams.isSortBy(field, 'asc') ? 'desc' : 'asc';

            svc.sortBy.set(order);
        }

        function sort(arr) {
            // format: {'name': 'asc'|'desc'}
            var orderBy = svc.sortBy.get();
            var field = Object.keys(orderBy)[0];
            if (!field) {
                return arr; // unsorted
            }

            var reverse = (orderBy[field] === 'desc');
            var groupBy = svc.groupBy.get();
            var sortArr = groupBy ? [sortFn(groupBy), sortFn(field)] : sortFn(field);
            //console.log('Sorting [%s] view [%s] by', name, orderBy[field], [groupBy, field]);

            return $filter('orderBy')(arr, sortArr, reverse);

            function sortFn(field) {
                return function (row) {
                    // TODO - perf
                    var model = _.map(row, function (cell) {
                        return (cell.model.field == field) ? cell.model : null
                    })[0];
                    return model ? model.value : ''; // some views may have no sorted fields
                }
            }
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
        //
        function validateColumnCell(col) {
            return function (newValue) {
                var res = true;
                if (col.edited) {
                    res = TableModel.isUniqueCol(col.model, newValue);
                }
                //console.log('>> Validate col=[%s] val=[%s], res=', col.model.field, newValue, res);
                return res;
            };
        }

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
            svc.reload();
        }

        function addRowOnTab(model) {
            var added = false;
            var lastCol = (model.field === 'description');

            if (lastCol) {
                var nextRow = TableModel.nextRowLike(model, getAlikePredicate(model));
                if (!nextRow) {
                    var res = TableModel.addRowLike(model);
                    svc.patchCriteria(projectId, res.patches);
                    svc.reload();
                    added = true;
                }
            }
            return added;
        }

        function addEmptyRow() {
            var res = TableModel.addRowLike(null);
            svc.patchCriteria(projectId, res.patches);
            svc.reload();
        }

        function getAlikePredicate(model) {
            var groupedBy = T.groupBy.get();
            var predicate = !groupedBy ? null : {
                key: groupedBy,
                value: model.criteria[groupedBy] // No vendors!
            };
            return predicate;
        }

        return V;
    };

    return T;
}
