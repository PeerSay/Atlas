/*global angular:true*/

angular.module('PeerSay')
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
    // Aggregate (share between ctrls)
    T.aggr = {
        rowIsMax: rowIsMax,
        columnTotalScore: columnTotalScore
    };


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
            .then(function () {
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
        // TODO - handle error
        return TableModel.buildModel(data.criteria);
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


    // Aggregate
    //
    function rowIsMax(value, rowVals) {
        if (!value) { return false; }

        var max = 0;
        _.forEach(rowVals, function (val) {
            if (val > max) {
                max = val;
            }
        });
        //console.log('>>Max-in-row for %s->%s, res=', value, JSON.stringify(rowVals), (value === max));
        return (value === max);
    }

    function columnTotalScore(prevVal, scores, weights) {
        var gradeTot = 0, weightTot = 0;
        _.forEach(scores, function (score, i) {
            var weight = weights[i];
            weightTot += weight;
            gradeTot += score * weight;
        });
        gradeTot = weightTot ? Math.round(gradeTot / weightTot * 10) / 10 : 0; // weighted average
        return gradeTot;
    }

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
        V.watching = watching;
        V.hovering = hovering;
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

        function watching() {
            // enable $watch on any scope change
            // requires V.watcher when it is ready in getData
            V.enableWatch = true;
            return V;
        }

        function hovering() {
            //enable hover effect on table rows
            V.enableHover = true;
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
                .then(function (viewSel) {
                    V.columns = viewSel.columns;
                    V.rows = viewSel.rows;
                    V.watcher = TableModel.viewModel.watcher;

                    $defer.resolve(V.rows);
                });
        }

        // Grouping
        function grouping() {
            // Setting groupBy on ngTable settings object enables grouping.
            // This function is called on table reload for every row(!)
            // and must return a value which groups given row under that group name.
            // Returning undefined for every row essentially makes a single group {undefined: [rows]},
            // whose 'falsy' name is not displayed by angular, thus rendering invisible group row.
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
        function saveCell(model) {
            var patch = TableModel.saveCell(model);
            svc.patchCriteria(projectId, patch);

            var needReload = (model.key === svc.groupBy.get());
            if (needReload) {
                svc.reload();
            }
        }

        function validateColumnCell(col) {
            return function (newValue) {
                var res = true;
                if (col.edited) {
                    res = TableModel.isUniqueColumn(col.model, newValue);
                }
                //console.log('>> Validate col=[%s] val=[%s], res=', col.model.field, newValue, res);
                return res;
            };
        }

        function saveColumnCell(col) {
            var model = col.model;
            var isAddNew = (col.id === 'virtual');
            var patch;
            if (isAddNew) {
                patch = TableModel.addColumn(model.value);
            }
            else {
                patch = TableModel.saveColumn(model);
            }

            svc.patchCriteria(projectId, patch);
            svc.reload();
        }

        function removeColumn(model) {
            var patch = TableModel.removeColumn(model);
            svc.patchCriteria(projectId, patch);
            svc.reload();
        }

        function removeRow(cell) {
            var patch = TableModel.removeRow(cell);
            svc.patchCriteria(projectId, patch);
            svc.reload();
        }

        function addRowLike(cell) {
            // find last criteria in group
            var prevCell = cell, nextRow;
            var predicate = getAlikePredicate(cell.model);
            while (nextRow = TableModel.nextRowLike(prevCell, predicate)) {
                prevCell = nextRow[0];
            }

            var patch = TableModel.addRowLike(prevCell);
            svc.patchCriteria(projectId, patch);
            svc.reload();
        }

        function addRowOnTab(cell) {
            var added = false;
            var model = cell.model;
            var lastCol = (model.key === 'description');

            if (lastCol) {
                var predicate = getAlikePredicate(model);
                var nextRow = TableModel.nextRowLike(cell, predicate);
                if (!nextRow) {
                    var patch = TableModel.addRowLike(cell);
                    svc.patchCriteria(projectId, patch);
                    svc.reload();
                    added = true;
                }
            }
            return added;
        }

        function addEmptyRow() {
            var patch = TableModel.addRowLike(null);
            svc.patchCriteria(projectId, patch);
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
