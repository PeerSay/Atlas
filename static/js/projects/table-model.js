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
            this.all = getTopics().list;
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
    T.isUniqueCol = isUniqueCol;
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
        var criteria = viewRow[0].model.criteria;
        //console.log('>>>>>groupBy [%s] crit=%O, returns: %s', curGroup, criteria, criteria[groupBy]);
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
        var nextIdx = cell.rowIdx + 1;
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

    function isUniqueCol(column, newValue) {
        var res = true;
        _.forEach(model.columns, function (col) {
            if (!col.vendor || col === column) { return; }

            if (col.field === newValue) {
                res = false;
            }
        });
        return res;
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
        var newIdx = cell ? cell.rowIdx + 1 : 0;

        var row = T.model.addRow(crit);
        T.viewModel.addRow(row, newIdx);

        var patch = jsonpatch.generate(T.patchObserver);
        console.log('Add row patch: ', JSON.stringify(patch));

        return patch;
    }

    function removeRow(cell) {
        var rowIdx = cell.rowIdx();
        var patches = [];

        // Make patch
        patches.push({
            op: 'remove',
            path: ['/criteria', rowIdx].join('/')
        });
        console.log('Remove row patch:', JSON.stringify(patches));

        //update model
        T.model.rows.splice(rowIdx, 1);
        // TODO: model.vendors = indexVendors(model.criteria);

        return {
            patches: patches,
            needReload: true
        };
    }

    function saveColumn(col) {
        var newVal = col.value;
        var key = col.field;
        var patches = [];

        _.forEach(T.model.rows, function (row, i) {
            var crit = row[0].criteria;
            var vendor = crit._vendorsIndex[key];
            var vendorIdx = crit.vendors.indexOf(vendor);
            if (vendor && vendorIdx >= 0) {
                // update model
                col.field = newVal;
                vendor.title = newVal;
                crit._vendorsIndex[newVal] = vendor;
                delete crit._vendorsIndex[key];

                patches.push({
                    op: 'replace',
                    path: ['/criteria', i, 'vendors', vendorIdx, 'title'].join('/'),
                    value: newVal
                });
            }
        });
        console.log('Save column patch:', JSON.stringify(patches));

        return {
            patches: patches,
            needReload: false // TODO
        };
    }

    function addColumn(newVal) {
        var patches = [];
        var newVendor = {
            title: newVal,
            value: ''
        };

        //add empty vendor to first criteria
        patches.push({
            op: 'add',
            path: ['/criteria', 0, 'vendors', '-'].join('/'),
            value: newVendor
        });
        console.log('Add column patch:', JSON.stringify(patches));

        // Update vendors model
        var criteria = T.model.rows[0][0].criteria;
        criteria.vendors.push(newVendor);
        criteria._vendorsIndex[newVal] = newVendor;
        var col = {
            id: ['col', T.model.columns.length + 1].join('_'),
            field: newVal,
            value: newVal,
            vendor: true
        };
        T.model.columns.push(col);

        _.forEach(T.model.rows, function (row, i) {
            var cell = buildCell(col, row, i, criteria);
            row.push(cell)
        });

        return {
            patches: patches,
            needReload: true
        };
    }

    function removeColumn(cell) {
        var patches = [];
        var key = cell.field;
        var col = cell.column;
        var colIdx = T.model.columns.indexOf(col);

        // update model & build patch
        _.forEach(T.model.rows, function (row, i) {
            var crit = row[0].criteria;
            var vendor = crit._vendorsIndex[key];
            var vendorIdx = crit.vendors.indexOf(vendor);
            // TODO - fix
            if (vendor && vendorIdx >= 0) {
                crit.vendors = crit.vendors.splice(vendorIdx, 1);
                delete crit._vendorsIndex[key];

                patches.push({
                    op: 'remove',
                    path: ['/criteria', i, 'vendors', vendorIdx].join('/')
                });
            }
        });
        console.log('Remove column patch:', JSON.stringify(patches));

        // update model cont.
        T.model.columns.splice(colIdx, 1);

        return {
            patches: patches,
            needReload: true
        };
    }


    // Misc
    function getTopics() {
        return indexArray(T.model.criteria, 'topic', null);
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
        })(arr, path.split('/'));

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
        M.columns = {};
        M.rows = [];
        // API
        M.build = build;
        M.addRow = addRow;
        M.getValByKey = getValByKey;
        M.setValByKey = setValByKey;

        // Format:
        // { name: 'name', ... , 'vendors/IBM/value': 'IMB', 'vendors/IBM/score': 'IMB', ...}
        var flatStruc = null;

        function build(data) {
            M.criteria = data;
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
                        field: field // to cancel edit
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
                    field: field, // ?
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

            var vendors = getVendors().list;
            // TODO - escape key
            _.forEach(vendors, function (val) {
                res[['vendors', val, 'value'].join('/')] = val;
                res[['vendors', val, 'score'].join('/')] = val;
            });
            //console.log('>>Flat: ', res);
            return res;
        }

        function getValByKey(crit, key) {
            var path = key.split('/'); // [vendors, IMB, score] or [name]
            var val = path.reduce(function (obj, p) {
                if (obj) {
                    return angular.isArray(obj) ? _.findWhere(obj, {title: p}) : obj[p];
                }
            }, crit);

            //console.log('>>Returned val for key: ', key, val);
            return angular.isDefined(val) ? val : null;
        }

        function setValByKey(crit, key, val) {
            var path = key.split('/'); // [vendors, IMB, score] or [name]
            var obj = crit, lastKey = null, exists = true;

            // find object to modify
            _.forEach(path, function (p) {
                var val = !angular.isArray(obj) ? obj[p] : _.findWhere(obj, {title: p});
                if (angular.isObject(val)) {
                    obj = val;
                }
                else if (!angular.isDefined(val)) { // undefined can only be non-existing vendor
                    exists = false;
                    obj = getNewVendor(p);
                }
                lastKey = p;
            });

            // patched!
            obj[lastKey] = val;
            if (!exists) {
                crit.vendors.push(obj);
            }
        }

        function addRow(critOrNull) {
            var criteria = getNewCriteria(critOrNull);
            var row = buildRow(criteria);

            M.criteria.push(criteria); // patched!
            M.rows.push(row); // to the end of array
            return row;
        }


        function getVendors() {
            return indexArray(M.criteria, 'vendors/title');
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
                value: '',
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
        //
        V.build = build;
        V.select = select;
        V.sort = sort;
        V.addRow = addRow;

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
                res.push({
                    model: model,
                    key: key,
                    id: 'col-' + (colIdx++) // TODO- may change
                });
            });
            return res;
        }

        function buildRow(modelRow) {
            var row = [];
            var cellIdx = 0;
            _.forEach(modelRow, function (model, key) {
                var cell = {
                    model: model,
                    field: model.field, // for select - to findWhere for virtual cells
                    colId: 'col-' + cellIdx, // for select - to find col TODO- may change
                    id: cellIdFn(row, cellIdx),
                    rowIdx: rowIdxFn(row)
                };
                cellIdx++;
                row.push(cell);
            });
            return row;
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
                var res = [];
                if (sel !== null){
                    // find matching cols in ViewModel
                    _.forEach(V.columns, function (col) {
                        if (!match(col, sel)) { return; }

                        var viewCol = {
                            model: col.model, // ref to model
                            key: col.key,
                            id: col.id, // TODO -fn
                            visible: true
                        };
                        // extend viewModel with requested props & spec to use it later on cells
                        res.push(angular.extend(viewCol, spec.column, {spec: spec}));
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
                    res.push(angular.extend(virtualCol, spec.column, {spec: spec}));
                }
                return res;
            }

            function selectViewCell(col, row) {
                var viewCell = {
                    visible: true
                };
                if (!col.virtual) {
                    var cell = _.findWhere(row, {colId: col.id}); // cannot be found for virtual cols
                    viewCell.model = cell.model;
                    viewCell.id = cell.id();
                    viewCell.rowIdx = cell.rowIdx();
                }
                else if (col.spec.cellModels) {
                    //cell manages several models (Popup case)
                    viewCell.models = {};
                    _.forEach(col.spec.cellModels, function (name) {
                        var cell = _.findWhere(row, {field: name});
                        viewCell.models[name] = cell.model;
                    });
                }
                // extend viewModel with requested props
                return angular.extend(viewCell, col.spec.cell);
            }

            function match(col, sel) {
                // col may be:
                // {.., key: 'name'}, -> matched by 'name'
                // {.., key: '/vendors/IMB/value'} -> -> matched by '/vendors/.*?/value' // TODO: '/' in vendor title -- need to escape
                var re = new RegExp(sel);
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
        function addRow(modelRow, idx) {
            V.rows.splice(idx, 0, buildRow(modelRow));
            V.rows[idx][0].justAdded = true;
        }

        return V;
    }

    return T;
}
