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

        T.viewModel.addRow(crit, newIdx); // updates model!

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Add row patch: ', JSON.stringify(patch));

        return patch;
    }

    function removeRow(cell) {
        var rowIdx = cell.rowIdx();

        T.viewModel.removeRow(rowIdx); // updates model!

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
            flatStruc = getFlatStruc(data);

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
                weight: 1,
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
        // Export
        V.getCSV = getCSV;


        // Build
        function build(model) {
            V.watcher.reset(true);
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
                var footer = { value: '', key: key, computed: {} };

                res.push({
                    model: model,
                    key: key,
                    id: 'col-' + (colIdx++),
                    footer: footer
                });

                if (isWatchedRow(key)) {
                    V.watcher.addFooterCell(footer);
                }
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
                    id: cellIdFn(row, cellIdx),
                    rowIdx: rowIdxFn(row)
                };

                if (isWatchedCol(key)) {
                    V.watcher.addColCell(cell, key);
                }
                if (isWatchedRow(key)) {
                    V.watcher.addRowCell(cell, modelRowIdx(cell));
                }

                cellIdx++;
                row.push(cell);
            });
            return row;
        }

        function isWatchedCol(key) {
            return (key === 'weight' || /score$/.test(key));
        }

        function isWatchedRow(key) {
            return /score$/.test(key);
        }

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

        function modelRowIdx(cell) {
            return T.model.criteria.indexOf(cell.model.criteria);
        }

        // Export
        function getCSV() {
            // titles
            var res = getRowStr(V.columns);
            console.log('>>> CSV Titles: ', res);
            // rows
            _.forEach(V.rows, function (row) {
                res += getRowStr(row);
            });
            // footer
            res += getRowStr(V.columns, 'footer');
            return res;
            //////

            function getRowStr(arr, field) {
                var res = '';
                _.forEach(arr, function (cell, j) {
                    var obj = field ? cell[field] : cell;
                    var val = obj.model ? obj.model.value : '';
                    var txt = stringify(val);
                    if (j > 0) {
                        res += ',';
                    }
                    res += txt;
                });
                return (res += '\n');
            }

            function stringify(val) {
                var str = (val === null) ? '' : val.toString();
                var res = str
                    .replace(/^\s*/, '').replace(/\s*$/, '') // trim spaces
                    .replace(/"/g,'""'); // replace quotes with double quotes;
                if (res.search(/("|,|\n)/g) >= 0) {
                    res = '"' + res + '"'; // quote if contains special chars
                }
                return res;
            }
        }

        // Select
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
                                viewCol.footer = col.footer;

                                var methods = getComputedMethods(spec.footer.computed, viewCol.footer);
                                angular.extend(viewCol.footer.computed, methods); // need to preserve original obj!
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
                    var cell = _.findWhere(row, {key: col.key});
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
                // {.., key: '/vendors\0IMB\0input'} -> -> matched by '/vendors/.*?/input'

                // selector accepts '/', but internally paths are joined with '\0' to allow / in vendor names
                var re = new RegExp(sel.replace(/\//g, '\0'));
                return re.test(col.key);
            }
        }

        // Sort
        function sort(keys, reverse) {
            var sortArr = _.map(keys, function (key) {
                return getRowValByKeyFn(key);
            });

            V.watcher.reset(); //!
            return (V.rows = $filter('orderBy')(V.rows, sortArr, reverse));
        }

        function getRowValByKeyFn(key) {
            return function (row) {
                var criteria = row[0].model.criteria;
                return T.model.getValByKey(criteria, key);
            };
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
            // 'row' - watch for those vals in cells' row (Max in scores rows)
            // 'footer' - watch for those computed vals in footer' row (Max in footer)
            return V.watcher.cachedComputeFn(spec, cell, function (val, arrays) {
                return computeFn.apply(null, [].concat(val, arrays));
            });
        }

        function Watcher() {
            var W = {};
            W.addColCell = addColCell;
            W.addRowCell = addRowCell;
            W.addFooterCell = addFooterCell;
            W.cachedComputeFn = cachedComputeFn;
            W.digest = digest;
            W.reset = reset;

            var reducers = {};
            var results = {};

            // build
            function addColCell(cell, key) {
                add(cell, 'col:' + key, 'model/value');
            }

            function addRowCell(cell, idx) {
                add(cell, 'row:' + idx, 'model/value');
            }

            function addFooterCell(cell) {
                add(cell, 'footer:total', 'computed/total');
            }

            function add (cell, uid, path) {
                if (!reducers[uid]) {
                    reducers[uid] = Reducer(path);
                }
                reducers[uid].add(cell);
            }

            // digest
            function digest() {
                var res = {};
                _.forEach(reducers, function (obj, key) {
                    var simple = obj.reduce(); // updates oldVal and array
                    res[key] = { newVal: simple, oldVal: obj.oldVal, array: obj.flatArray };
                    //console.log('>>Digest res for [%s]:', key, JSON.stringify(res[key]));
                });
                //console.log('>>Digest - done!');
                return (results = res);
            }

            function reset(deep) {
                if (deep) {
                    // called when new viewModel is built - to prevent adding ros/cols to non-empty arrays
                    reducers = {};
                } else {
                    // called on sort because no value is changed, but they become invalid
                    _.forEach(reducers, function (obj) {
                        obj.reset();
                    });
                }
                //console.log('>>Reset - deep?=%s', !!deep);
            }

            //get
            function cachedComputeFn(spec, cell, computeCb) {
                var keys = parseSpec(spec, cell);
                var value = function () {
                    //Footer has no model.value but we add it on digest!
                    return cell.model ? cell.model.value : 0;
                };
                var prevValue = null;

                return function () {
                    var params = [];
                    var modified = false;
                    _.forEach(keys, function (key) {
                        var res = results[key];
                        if (!res) { return; }
                        //console.log('>> ComputeFn of %s:', JSON.stringify(keys), JSON.stringify(res));

                        if (res.newVal !== res.oldVal) {
                            modified = true;
                        }
                        params.push(res.array);
                    });

                    var oldPrevValue = prevValue;
                    var needCompute = modified || (prevValue === null && (params.length === keys.length));
                    if (needCompute) {
                        prevValue = computeCb(value(), params);
                        //console.log('>> Computed long res=[%s]<-[%s], of keys', prevValue, oldPrevValue, JSON.stringify(keys));
                    }
                    //console.log('>>  Computed return=[%s] of keys', prevValue, JSON.stringify(keys));
                    return prevValue;
                };
            }


            function parseSpec(specStr, cell) {
                var specs = specStr.split(',');
                var res = _.map(specs, function (spec) {
                    return parseOne(spec, cell);
                });
                return res;
            }

            function parseOne(spec, cell) {
                var kind = spec.split(/:/)[0];
                var res = '';
                if (kind === 'col') {
                    var colKey = spec.split(/:/)[1] || null;
                    res = 'col:' + (colKey || cell.key);
                } else if (kind === 'row') {
                    var rowIdx = getModelIdx(cell.model.criteria);
                    res = 'row:' + rowIdx;
                } else if (kind === 'footer') {
                    res =  'footer:total';
                }
                return res;

                function getModelIdx(crit) {
                    return T.model.criteria.indexOf(crit);
                }
            }

            return W;
        }

        function Reducer(path) {
            var R = {};
            R.add = add;
            R.reduce = reduce;
            R.reset = reset;
            R.oldVal = null;
            R.newVal = null;
            R.flatArray = [];

            var array = [];
            var obj = path.split('/')[0];
            var key = path.split('/')[1];

            function add(item) {
                array.push(item);
            }

            function reduce() {
                //console.log('>> Reducing: ', JSON.stringify(array));
                R.flatArray = _.map(array, function (item) {
                    var val = item[obj] ? item[obj][key] : 0; // XXX - null?
                    if (angular.isFunction(val)) { // computed
                        val = val() || 0;
                        item.model = {value: val}; // hack!
                    }
                    return val;
                });
                R.oldVal = R.newVal;
                return (R.newVal = R.flatArray.join(''));
            }

            function reset() {
                R.newVal = null;
            }

            return R;
        }

        return V;
    }

    return T;
}
