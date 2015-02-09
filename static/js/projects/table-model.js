/*global angular:true*/

angular.module('peersay')
    .factory('TableModel', TableModel);

TableModel.$inject = ['$filter', 'Util', 'jsonpatch'];
function TableModel($filter, _, jsonpatch) {
    var T = {};
    T.model = Model();
    T.viewModel = ViewModel();
    T.topics = {
        all: [],
        rebuild: function () {
            this.all = getTopics();
        }
    };
    T.patchObserver = null;

    // Build/select
    T.buildModel = buildModel;
    T.selectViewModel = selectViewModel;
    // Group & sort
    T.getGroupByValue = getGroupByValue;
    T.sortViewModel = sortViewModel;
    // Traverse
    T.nextRowLike = nextRowLike;
    T.isUniqueColumn = isUniqueColumn;
    // Edit
    T.saveCell = saveCell;
    T.addRowLike = addRowLike;
    T.removeRow = removeRow;
    T.saveColumn = saveColumn;
    T.addColumn = addColumn;
    T.removeColumn = removeColumn;


    // Build & select
    function buildModel(data) {
        T.patchObserver = jsonpatch.observe({criteria: data});

        T.model.build(data);
        T.topics.rebuild(); // XXX

        T.viewModel.build(T.model);
        return T.model;
    }

    function selectViewModel(specFn) {
        var spec = specFn(T.model); // get spec
        return T.viewModel.select(spec);
    }

    // Group & sort
    //
    function getGroupByValue(viewRow, groupBy) {
        var cell0 = viewRow[0];
        var model = cell0.model || cell0.models.name; // virtual {name} col is added for empty Products table
        var criteria = model.criteria;
        //console.log('>>>>>groupBy [%s] crit=%O, returns: %s', groupBy, criteria, criteria[groupBy]);
        return criteria[groupBy];
    }

    function sortViewModel(orderBy, groupBy) {
        // orderBy format: {'name': 'asc'|'desc'}
        var key = Object.keys(orderBy)[0];
        if (!key) {
            return T.viewModel.rows; // unsorted
        }

        var reverse = (orderBy[key] === 'desc');
        var keys = groupBy ? [groupBy, key] : [key];
        return T.viewModel.sort(keys, reverse);
    }

    // Traverse
    //
    function nextRowLike(cell, predicate) {
        var nextIdx = cell.rowIdx() + 1;
        var groupedRows = [];
        _.forEach(T.viewModel.rows, function (row) {
            var crit = row[0].model.criteria;
            var alike = predicate ? (crit[predicate.key] === predicate.value) : true;
            var afterCell = (row[0].rowIdx() >= nextIdx);
            if (alike && afterCell) {
                groupedRows.push(row);
            }
        });
        return groupedRows[0] || null;
    }

    function isUniqueColumn(colModel, newValue) {
        return T.model.isUniqueColumn(colModel, newValue);
    }

    // Edits
    //

    function saveCell(cell) {
        T.model.setValByKey(cell.criteria, cell.key, cell.value);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Save cell patch: ', JSON.stringify(patch));

        return patch;
    }

    function addRowLike(cell) {
        var crit = cell ? cell.model.criteria : null;
        var newIdx = cell ? cell.rowIdx() + 1 : 0;

        T.viewModel.addRow(crit, newIdx);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Add row patch: ', JSON.stringify(patch));

        return patch;
    }

    function removeRow(cell) {
        var rowIdx = cell.rowIdx();
        T.viewModel.removeRow(rowIdx);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Remove row patch:', JSON.stringify(patch));

        return patch;
    }

    function saveColumn(col) {
        T.model.saveColumn(col, col.value);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Save column patch:', JSON.stringify(patch));

        // rebuild!
        //_.timeIt('rebuild!', buildModel, 1000)(T.model.criteria);
        buildModel(T.model.criteria);

        return patch;
    }

    function addColumn(newVal) {
        T.model.addColumn(newVal);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Add column patch:', JSON.stringify(patch));

        // rebuild!
        //_.timeIt('rebuild!', buildModel, 1000)(T.model.criteria);
        buildModel(T.model.criteria);

        return patch;
    }

    function removeColumn(cellModel) {
        T.model.removeColumn(cellModel);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Remove column patch:', JSON.stringify(patch));

        // rebuild!
        //_.timeIt('rebuild!', buildModel, 1000)(T.model.criteria);
        buildModel(T.model.criteria);

        return patch;
    }


    // Misc
    function getTopics() {
        return indexArray(T.model.criteria, 'topic', null).list;
    }

    function indexArray(arr, path, init) {
        var list = [];
        var index = {};
        var add = function (val) {
            if (!index[val]) {
                index[val] =  true;
                list.push(val);
            }
        };

        if (arguments.length > 2) {
            add(init);
        }
        (function iterate(arr, paths) {
            var key = paths[0];
            _.forEach(arr, function (it) {
                if (angular.isArray(it[key])) {
                    iterate(it[key], paths.slice(1));
                }
                else {
                    add(it[key]);
                }
            });
        })(arr, path.split('\0'));

        return {
            index: index,
            list: list
        };
    }


    // Model class
    //
    function Model() {
        var M = {};
        M.criteria = null;
        M.vendors = null;
        M.columns = {};
        M.rows = [];
        // API
        M.build = build;
        M.addRow = addRow;
        M.removeRow = removeRow;
        M.getValByKey = getValByKey;
        M.setValByKey = setValByKey;
        M.isUniqueColumn = isUniqueColumn;
        M.saveColumn = saveColumn;
        M.addColumn = addColumn;
        M.removeColumn = removeColumn;

        // Format:
        // { name: 'name', ... , 'vendors/IBM/input': 'IMB', 'vendors/IBM/score': 'IMB', ...}
        var flatStruc = null;

        function build(data) {
            M.criteria = data;
            M.vendors = getVendors();
            flatStruc = getFlatStruc(data); // private
            M.columns = buildColumns();
            M.rows = [];
            _.forEach(data, function (crit) {
                M.rows.push(buildRow(crit));
            });
            return M;
        }

        function buildColumns() {
            var columns = {};
            var sharedColModels = {};
            _.forEach(flatStruc, function (field, key) {
                var val = getColVal(field);
                var colModel = sharedColModels[field] || {
                        value: val, // binding!
                        field: field // to verify & cancel edit
                    };
                columns[key] = sharedColModels[field] = colModel;
            });
            return columns;
        }

        function buildRow(crit) {
            var row = {};
            _.forEach(flatStruc, function (field, key) {
                var cellModel = {
                    value: getValByKey(crit, key),
                    key: key, // for save
                    criteria: crit // for group & sort
                };
                row[key] = cellModel;
            });
            return row;
        }

        function getFlatStruc() {
            var res = {};
            _.forEach(['name', 'description', 'topic', 'priority', 'weight'], function (val) {
                res[val] = val;
            });

            _.forEach(M.vendors, function (val) {
                res[['vendors', val, 'input'].join('\0')] = val;
                res[['vendors', val, 'score'].join('\0')] = val;
            });

            //console.log('>>Flat: ', res);
            return res;
        }

        function getValByKey(crit, key) {
            var path = key.split('\0'); // [vendors, IMB, score] or [name]
            var val = path.reduce(function (obj, p) {
                if (obj) {
                    return angular.isArray(obj) ? _.findWhere(obj, {title: p}) : obj[p];
                }
            }, crit);

            //console.log('>>Returned val for key: ', key, val);
            return angular.isDefined(val) ? val : null;
        }

        function getObjByKey(crit, key) {
            var path = key.split('\0'); // [vendors, IMB, score] or [name]
            var obj = crit, lastKey = null, justAdded = false;

            // find object to modify
            _.forEach(path, function (p) {
                var val = !angular.isArray(obj) ? obj[p] : _.findWhere(obj, {title: p});
                if (angular.isObject(val)) {
                    obj = val;
                }
                else if (!angular.isDefined(val)) { // undefined can only be non-existing vendor
                    justAdded = true;
                    obj = getNewVendor(p);
                }
                lastKey = p;
            });

            return {
                obj: obj,
                key: lastKey,
                justAdded: justAdded
            };
        }

        function setValByKey(crit, key, val, noAdd) {
            var res = getObjByKey(crit, key);

            // patched!
            res.obj[res.key] = val;
            if (res.justAdded && !noAdd) {
                crit.vendors.push(res.obj);
            }
        }

        function isUniqueColumn(column, newValue) {
            var res = true;
            _.forEach(M.columns, function (col) {
                if (col === column) { return; }
                if (col.field === newValue) {
                    res = false;
                }
            });
            return res;
        }

        // Mutate
        function addRow(critOrNull) {
            var criteria = getNewCriteria(critOrNull);
            var row = buildRow(criteria);

            M.criteria.push(criteria); // patched!
            M.rows.push(row); // to the end of array
            return row;
        }

        function removeRow(crit) {
            var critIdx = M.criteria.indexOf(crit);

            // Patched!
            M.criteria.splice(critIdx, 1);
            M.rows.splice(critIdx, 1); // always same idx as criteria
        }

        function saveColumn(col, newVal) {
            var key = ['vendors', col.field, 'title'].join('\0');
            _.forEach(M.criteria, function (crit) {
                setValByKey(crit, key, newVal, true); // patched!
            });

            // Model is inconsistent - need to rebuild!
        }

        function addColumn(newVal) {
            var key = ['vendors', newVal, 'title'].join('\0');
            _.forEach(M.criteria, function (crit) {
                setValByKey(crit, key, newVal); // patched!
            });

            // Model is inconsistent - need to rebuild!
        }

        function removeColumn(cell) {
            var key = cell.key;

            _.forEach(M.criteria, function (crit) {
                var res = getObjByKey(crit, key);
                if (!res.obj  || res.justAdded) { return; }

                var vendorIdx = crit.vendors.indexOf(res.obj);
                crit.vendors.splice(vendorIdx, 1); // patched!
            });

            // Model is inconsistent - need to rebuild!
        }

        // Misc
        function getVendors() {
            return indexArray(M.criteria, 'vendors\0title').list;
        }

        function getColVal(field) {
            var names = {
                name: 'Criteria',
                description: 'Description',
                topic: 'Topic',
                priority: 'Priority',
                weight: 'Weight'
            };
            return names[field] || field;
        }

        function getNewVendor(title) {
            return {
                title: title,
                input: '',
                score: 0
            };
        }

        function getNewCriteria(crit) {
            return {
                name: '',
                description: '',
                topic: crit ? crit.topic : null,
                priority: crit ? crit.priority : 'required',
                vendors: []
            };
        }

        return M;
    }

    // ViewModel class
    //
    function ViewModel() {
        var V = {};
        V.columns = [];
        V.rows = [];
        V.watcher = Watcher();
        // API
        V.build = build;
        V.select = select;
        V.sort = sort;
        V.addRow = addRow;
        V.removeRow = removeRow;

        // Build
        function build(model) {
            V.columns = buildColumns(model.columns);
            V.rows = [];
            _.forEach(model.rows, function (row) {
                V.rows.push(buildRow(row));
            });
            //console.log('>>>> ViewModel:', JSON.stringify({c: V.columns, r: V.rows}, null, 4));
            return V;
        }

        function buildColumns(modelColumns) {
            var res = [];
            var colIdx = 0;
            _.forEach(modelColumns, function (model, key) {
                var footer = { value: '', key: key, computed: null }; // shared model - XXX

                res.push({
                    model: model,
                    key: key,
                    id: 'col-' + (colIdx++),
                    footer: footer
                });

                /*if (isWatchedCol(key)) {
                    //console.log('>>> Register watcher for', key);
                    V.watcher.register(key);
                }*/
            });
            return res;
        }

        function buildRow(modelRow) {
            var row = [];
            var cellIdx = 0;
            _.forEach(modelRow, function (model, key) {
                var cell = {
                    model: model,
                    key: key,
                    colId: 'col-' + cellIdx, // for select - to find col
                    id: cellIdFn(row, cellIdx),
                    rowIdx: rowIdxFn(row)
                };

                /*if (isWatchedCol(key)) {
                    V.watcher.addModel(key, cell.model);
                }*/

                cellIdx++;
                row.push(cell);
            });
            return row;
        }

        /*function isWatchedCol(key) {
            return (key === 'weight' || /\/score$/.test(key));
        }*/

        function rowIdxFn(row) {
            return function () {
                return V.rows.indexOf(row);
            };
        }

        function cellIdFn(row, i) {
            var rowIdx = rowIdxFn(row);
            return function () {
                return ['cell', rowIdx(), i].join('-');
            };
        }

        //Select
        function select(spec) {
            /**
             * var specFormat = [{
                selector: 'key_re', // or ['key1','key2'] or null (for virtual)
                limit: 3, // optional
                columnModel: {}, // optional, model for virtual col
                cellModels: [], // optional, models selector for virtual cells
                column: {
                    sortable: true, // optional
                    editable: true, // optional
                    last: true //optional - for css
                },
                cell: {
                    type: 'ordinary', // 'multiline', 'static', 'number', 'popup'
                    editable: true, // optional
                    emptyValue: 'str' // optional, displayed when model.value is empty
                }
              }, ...];
             */
            var res = {
                columns: [],
                rows: []
            };

            //Columns
            _.forEach(spec, function (item) {
                // each item in spec defines one or more columns to show on view
                var selectors = angular.isArray(item.selector) ? item.selector : [item.selector];

                // select columns for each selector in order
                var viewColumns = [];
                _.forEach(selectors, function (sel) {
                    viewColumns = [].concat(viewColumns, selectViewColumns(item, sel));
                });

                //limit resulting columns (per item)
                if (item.limit) {
                    viewColumns.splice(item.limit);
                }

                res.columns = [].concat(res.columns, viewColumns);
            });
            //console.log('>>>> SelModel:', JSON.stringify(res.columns, null, 4));

            //Rows (already sorted)
            _.forEach(V.rows, function (row) {
                var viewRow = [];
                // pick the cells of the columns we just selected
                _.forEach(res.columns, function (col) {
                    viewRow.push(selectViewCell(col, row));
                });
                res.rows.push(viewRow);
            });
            //console.log('>>>> SelModel:', JSON.stringify(res.rows, null, 4));

            return res;
            //////

            function selectViewColumns(spec, sel) {
                var cols = [];
                if (sel !== null){
                    // find matching cols in ViewModel
                    _.forEach(V.columns, function (col) {
                        if (!match(col, sel)) { return; }

                        var viewCol = {
                            model: col.model, // ref to model
                            key: col.key,
                            id: col.id, // TODO -fn?
                            visible: true
                        };

                        if (spec.footer) {
                            viewCol.footer = {};
                            if (spec.footer.value) {
                                // if value specified then assign it (for static text)
                                viewCol.footer.value = spec.footer.value;
                            }
                            else if(spec.footer.computed) {
                                viewCol.footer.model = {value: 0};

                                // TODO - fix max() for footer:
                                // We compute values on ViewModel, but:
                                // - we don't know what to watch until the view is selected
                                // - thus need to add computed fields to ViewModel here
                                // - and prevent several selectedViews to overwrite it
                                // it means selectedViews *must* specify the same footer spec for the selected cols

                                viewCol.footer.computed = getComputedMethods(spec.footer.computed, viewCol);
                            }
                        }

                        // extend viewModel with requested props & spec to use it later on cells
                        cols.push(angular.extend(viewCol, spec.column, {spec: spec}));
                    });
                }
                else {
                    var virtualCol = {
                        key: null, // not sortable
                        id: 'virtual', // now only one virtual col in tables
                        visible: true,
                        virtual: true
                    };
                    if (spec.columnModel) {
                        // model is provided by spec (Add Product col)
                        virtualCol.model = spec.columnModel;
                    }
                    // extend viewModel with requested props & spec to use it later on cells
                    cols.push(angular.extend(virtualCol, spec.column, {spec: spec}));
                }
                return cols;
            }

            function selectViewCell(col, row) {
                var viewCell = {
                    visible: true
                };
                var spec = angular.copy(col.spec); // XXX - passed via col

                if (!col.virtual) {
                    var cell = _.findWhere(row, {colId: col.id}); // cannot be found for virtual cols
                    viewCell.model = cell.model;
                    viewCell.id = cell.id();
                    viewCell.rowIdx = cell.rowIdx;
                    if (cell.justAdded && spec.cell.editable) {
                        viewCell.justAdded = cell.justAdded;
                        delete cell.justAdded;
                        //console.log('>> Just added: ', viewCell);
                    }

                    var computedSpec = spec.cell && spec.cell.computed;
                    if(computedSpec) {
                        delete spec.cell.computed; // prevent overriding by extend() below
                        viewCell.computed = getComputedMethods(computedSpec, cell);
                    }
                }
                else if (spec.cellModels) {
                    //cell manages several models (Popup case)
                    viewCell.models = {};
                    _.forEach(spec.cellModels, function (name) {
                        var cell = _.find(row, function (viewCell) {
                            return (viewCell.model.key === name);
                        });
                        viewCell.models[name] = cell.model;
                    });
                }
                // extend viewModel with requested props
                return angular.extend(viewCell, spec.cell);
            }

            function match(col, sel) {
                // col may be:
                // {.., key: 'name'}, -> matched by 'name'
                // {.., key: '/vendors/IMB/input'} -> -> matched by '/vendors/.*?/input'

                // selector accepts '/', but internally paths are joined with '\0' to allow / in vendor names
                var re = new RegExp(sel.replace(/\//g, '\0'));
                //console.log('>>>Matching', col, sel, re.test(col.key));
                return re.test(col.key);
            }
        }

        //Sort
        function sort(keys, reverse) {
            var sortArr = _.map(keys, function (key) {
                return getRowValByKeyFn(key);
            });

            return (V.rows = $filter('orderBy')(V.rows, sortArr, reverse));
        }

        function getRowValByKeyFn(key) {
            return function (row) {
                var criteria = row[0].model.criteria;
                return T.model.getValByKey(criteria, key);
            }
        }

        // Mutate
        function addRow(crit, idx) {
            //update model first
            var row = T.model.addRow(crit);
            V.rows.splice(idx, 0, buildRow(row));
            V.rows[idx][0].justAdded = true;
        }

        function removeRow(idx) {
            var removedRow = V.rows.splice(idx, 1);

            var crit = removedRow[0][0].model.criteria;
            T.model.removeRow(crit);
        }

        // Watch/compute
        function getComputedMethods(spec, cell) {
            var res = {};
            _.forEach(spec, function (arr, method) {
                var getterSpec = arr[0];
                var computeFn = arr[1];
                res[method] = getComputeWatcher(cell, getterSpec, computeFn);
            });
            return res;
        }

        function getComputeWatcher(cell, spec, computeFn) {
            // spec formats:
            // 'col' - watch for all vals in cells' column (Weight percents)
            // 'col,col:weight' - watch for cells' column and columns with key=weight (Score totals)
            // 'row~number' - watch for those vals in cells' row, that have type=number (Max in scores rows)
            // 'footer' - watch for those computed vals in footer' row (Max in footer)
            var watcher = V.watcher.getMatched(spec, cell);

            return function () {
                // This func is called on $digest for every cell/footer that has computed vals.
                // It must return fast!
                // Thus it:
                // 1. gets previous value of computeFn and 'simple value' of all cols/rows per watcher
                // 2. computes new 'simple value' (join) on every call and compares it tp previous
                // 3. if not changed, then returns previous value of computeFn (most of the time)
                // 4. otherwise, it calls computeFn and returns it's value
                // -> this value is used by View

                //TODO
                /*var res = watcher.value;
                var prevSimple = watcher.simple;
                var simple = watcher.getSimple();
                if (simple !== prevSimple) {
                    res = watcher.value = computeFn.apply(null, [].concat(cell.model.value, watcher.params()));
                }
                return res;*/

                var val = cell.model.value; // TODO: footer computed value
                return computeFn.apply(null, [].concat(val, watcher.watched()));
            };
        }

        function Watcher() {
            var W = {};
            W.getMatched = getMatched;
            var watchers = {};

            function getMatched(spec, cell) {
                var parsed = parseSpec(spec, cell);
                var uid = getUid(parsed);
                //console.log('>>Watched uid: ', uid);
                var cached = watchers[uid];
                if (cached) { return cached; }

                return (watchers[uid] = WatcherOne(parsed));
            }

            function parseSpec(specStr, cell) {
                var specs = specStr.split(',');
                var res = _.map(specs, function (spec) {
                    return parseOne(spec, cell);
                });
                return res;
            }

            function parseOne(spec, cell) {
                var kind = spec.split(/~|:/)[0];
                var rowType = spec.split(/~/)[1] || null;
                var colKey = spec.split(/:/)[1] || null;
                var rowIdx = cell.rowIdx && cell.rowIdx();

                var res = {
                    kind : kind,
                    colKey: (kind === 'col') ? (colKey || cell.key) : null,
                    rowKey: (kind === 'row') ? {idx: rowIdx, type: rowType} : null
                };
                return res;
            }

            function getUid(parsed) {
                return _.map(parsed, function (o) {
                    return o.colKey ? ('col:' + o.colKey) :
                        o.rowKey ? (['row', o.rowKey.idx, o.rowKey.type].join(':')) :
                            'footer';
                }).join('|');
            }

            return W;
        }

        function WatcherOne(parsed) {
            var W = {};
            W.value = null;
            W.simple = null;
            W.getSimple = getSimple;
            W.watched = getWatched;

            var watched = [];

            init();

            function init() {
                _.forEach(parsed, buildWatched);
            }

            function getWatched() {
                return watched;
            }

            function buildWatched(specObj) {
                var array;
                if (specObj.kind === 'col'){
                    array = getCol(specObj.colKey);
                } else if (specObj.kind === 'row') {
                    array = getRow(specObj.rowKey);
                } else {
                    array = getFooter();
                }
                watched.push(array);
                //console.log('>>Got watcher: ', JSON.stringify(array));
            }

            function getCol(key) {
                var res = _.map(V.rows, function (row) {
                    return _.findWhere(row, {key : key}).model; // 1 cell
                });
                return res;
            }

            function getRow(rowKey) {
                var res = _.map(V.rows[rowKey.idx], function (cell) {
                    return (cell.key.indexOf(rowKey.type) >= 0) ? cell.model: null;
                });
                return res;
            }

            function getFooter() {
                var res =_.map(V.columns, function (col) {
                    return col.footer.computed ? col.footer.computed : null;
                });
                return res;
            }

            function getSimple() {
                var res = '';
                _.forEach(watched, function (arr) {
                    res += _.map(arr, function (item) {
                        return item.value;
                    }).join('');
                });
                return (W.simple = res);
            }

            return W;
        }

        return V;
    }

    return T;
}
