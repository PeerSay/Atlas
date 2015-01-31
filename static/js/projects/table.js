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
    function addVIew(ctrl, name, configFn) {
        views[name] = {
            //toData: _.timeIt('toData-' + name, configFn, 1000)
            configFn: configFn
        };
        return TableView(ctrl, name, T);
    }

    function toData(projectId, name) {
        return readCriteria(projectId)
            .then(function (model) {
                //return views[name].toData(model);
                return TableModel.selectViewModel(views[name].configFn);
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
        return TableModel.buildModel2(data.criteria);
    }

    function readCriteria(id) {
        return Backend.read(['projects', id, 'criteria'])
            .then(function (res) {
                return (model = res);
            });
    }

    function updateCriteria(id, data) {
        return Backend.update(['projects', id, 'criteria'], data); // TODO - remove
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
        //V.sort = _.timeIt('sort', TableModel.sortViewModel, 1000);
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
                    //var rows = V.sort(data.rows);

                    V.columns = data.columns;
                    V.rows = data.rows;

                    $defer.resolve(data.rows);
                });
        }

        // Grouping
        function grouping() {
            // Setting groupBy on ngTable settings object enables grouping.
            // This function is called on table reload for every row(!)
            // and must return a value which groups given row under that group name.
            // Returning undefined for every row essentially makes a single group {undefined: [rows]},
            // whose 'falsy' name is not displayed by angular rendering invisible group row.
            //
            settings.groupBy = function (row) {
                var groupBy = svc.groupBy.get();
                return TableModel.getGroupByValue(row, groupBy);
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
                // Expose click handler for html. Only for views that requested active sorting.
                V.sortBy = sortBy;
            }

            $rootScope.$on('sorting', function (evt, order) {
                // This call causes table reload if order differs.
                // By this time viewModel is already sorted and selectView happening on every reload
                // will get rows in required sorted order.
                V.tableParams.sorting(order);
            });
            return V;
        }

        function sortBy(col) {
            var field = col.key;
            if (!field) { return; } // non-sortable (virtual) cols have no key

            var orderBy = {};
            orderBy[field] = V.tableParams.isSortBy(field, 'asc') ? 'desc' : 'asc';

            var groupBy = svc.groupBy.get();

            //V.sort(orderBy, groupBy);
            TableModel.sortViewModel(orderBy, groupBy);
            svc.sortBy.set(orderBy);
        }

        // Class
        function runtimeColClass(col) {
            var edited = col.edited;
            var sortable = V.sortBy && col.sortable && !edited;

            return {
                'sortable': sortable,
                'sort-asc': V.tableParams.isSortBy(col.key, 'asc'),
                'sort-desc': V.tableParams.isSortBy(col.key, 'desc'),
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
                    TableModel.topics.rebuild(); // XXX
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
            var patch = TableModel.saveCell(cell);
            svc.patchCriteria(projectId, patch);

            var needReload = (cell.field === svc.groupBy.get());
            if (needReload) {
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
