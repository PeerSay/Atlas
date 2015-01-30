/*global angular:true*/

angular.module('peersay')
    .factory('TableModel', TableModel);

TableModel.$inject = ['Util'];
function TableModel(_) {
    var M = {};
    var model = M.model = {
        columns: [],
        rows: []
    };
    M.viewModel = null;
    M.topics = {
        all: [],
        rebuild: function () {
            this.all = findTopics();
        }
    };

    // Build/select
    M.buildModel = buildModel;
    M.buildModel2 = buildModel2;
    M.buildViewModel = buildViewModel;

    M.selectColumns = selectColumns; // XXX
    M.selectViewModel = selectViewModel;
    // Traverse
    M.nextRowLike = nextRowLike;
    M.isUniqueCol = isUniqueCol;
    // Edit
    M.saveCell = saveCell;
    M.addRowLike = addRowLike;
    M.removeRow = removeRow;
    M.saveColumn = saveColumn;
    M.addColumn = addColumn;
    M.removeColumn = removeColumn;

    function buildModel2(data) {
        // flatStruc is:
        // { name: 'name', ... , 'vendors/IBM/value': 'IMB', 'vendors/IBM/score': 'IMB', ...}
        var flatStruc = getFlatStruc(data);
        //console.log('>> flat', JSON.stringify(flatStruc));

        // Columns
        var columns = {};
        var sharedColModels = {};
        _.forEach(flatStruc, function (field, key) {
            var val = getColVal(field);
            var colModel = sharedColModels[field] || {
                value: val, // binding!
                field: field // for sorting?
            };
            columns[key] = sharedColModels[field] = colModel;
        });

        // Rows
        var rows = [];
        _.forEach(data, function (crit) {
            var row = {};
            _.forEach(flatStruc, function (field, key) {
                var cellModel = {
                    field: field,
                    value: getCellVal(crit, key),
                    //criteria: crit,
                    patch: {} // TODO
                };
                row[key] = cellModel;
            });
            rows.push(row);
        });

        M.model.columns = columns;
        M.model.rows = rows;
        return M.model;

        //////

        function getFlatStruc(criteria) {
            var res = {};
            _.forEach(['name', 'description', 'topic', 'priority', 'weight'], function (val) {
                res[val] = val;
            });

            var vendors = {};
            _.forEach(criteria, function (crit) {
                _.forEach(crit.vendors, function (vendor) {
                    if (!vendors[vendor.title]) {
                        vendors[vendor.title] =  true;
                    }
                });
            });

            // TODO - escape key
            _.forEach(vendors, function (v, key) {
                res[['vendors', key, 'value'].join('/')] = key;
                res[['vendors', key, 'score'].join('/')] = key;
            });
            return res;
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

        function getCellVal(crit, key) {
            var path = key.split('/'); // [vendors, IMB, score] or [name]
            var val = path.reduce(function (obj, p) {
                if (obj) {
                    return angular.isArray(obj) ? _.findWhere(obj, {title: p}) : obj[p]
                }
            }, crit);

            //console.log('>>Returned val for key: ', key, val);
            return angular.isDefined(val) ? val : null;
        }
    }

    function buildViewModel(model) {
        // Columns
        var columns = [];
        var colIdx = 0;
        _.forEach(model.columns, function (model, key) {
            columns.push({
                model: model,
                key: key,
                id: 'col-' + (colIdx++)
            });
        });

        //Rows
        var rows = [];
        _.forEach(model.rows, function (row, rowIdx) {
            var viewRow = [], cellIdx = 0;
            _.forEach(row, function (model, key) {
                var cell = {
                    model: model,
                    //key: key, /// TODO - need?
                    colId: 'col-' + cellIdx,
                    id: ['cell', rowIdx, cellIdx].join('-')
                };
                cellIdx++;
                viewRow.push(cell);
            });
            rows.push(viewRow);
        });

        M.viewModel = {
            columns: columns,
            rows: rows
        };
        //console.log('>>>> ViewModel:', JSON.stringify(M.viewModel, null, 4));

        return M.viewModel;
    }

    function buildModel(data) {
        // Server data format:
        // [
        //  { name: '', description: '', topic: '', priority: '', products: [ TODO - rename
        //    { title: '', input: '', score: '' },
        //    ...
        //   ]
        //  },
        //  ...
        // ]

        // Columns
        var columns = [
            {field: 'name', value: 'Criteria'},
            {field: 'description', value: 'Description'},
            {field: 'topic', value: 'Topic'},
            {field: 'priority', value: 'Priority'}
        ];
        model.columns = columns.concat(indexVendors(data));

        // Rows
        var rows = [];
        _.forEach(data, function (crit, i) {
            var row = buildRow(crit, i);
            rows.push(row);
        });
        model.rows = rows;

        // TODO - virtual rows / cols?

        M.topics.rebuild(); // XXX
        return model;
    }

    function buildRow(crit, rowIdx, justAdded) {
        var row = [];
        _.forEach(M.model.columns, function (col) {
            var cell = buildCell(col, row, rowIdx, crit);
            if (justAdded && cell.field === 'name') {
                cell.justAdded = true;
            }
            row.push(cell);
        });
        return row;
    }

    function buildCell(col, row, rowIdx, crit) {
        var cell = {};
        var key = col.field;
        var vendor, vendorIdx;
        var model = {};
        if (!col.vendor) {
            model.obj = crit;
            model.key = key;
            model.path = key;
            model.op = 'replace';
            model.exists = true;
        }
        else if (vendor = crit._vendorsIndex[key]) {
            vendorIdx = crit.vendors.indexOf(vendor);
            model.obj = vendor;
            model.key = 'value';
            model.path = ['vendors', vendorIdx, 'value'].join('/');
            model.op = 'replace';
            model.exists = true;
        } else { // no vendor yet
            model.obj = { title: key, value: '' };
            model.key = 'value';
            model.path = ['vendors', '-'].join('/');
            model.op = 'add';
            model.exists = false;
        }

        var value = model.obj[model.key];
        cell.id = [key, rowIdx].join('_');
        cell.field = key;
        cell.value = value;
        cell.patch = {
            op: model.op,
            path: ['/criteria', rowIdx, model.path].join('/')
        };
        cell.column = col;
        cell.criteria = crit;
        cell.exists = model.exists;
        cell.rowIdx = function () {
            return M.model.rows.indexOf(row); // changes
        };
        return cell;
    }

    function indexVendors(criteriaArr) {
        // criteriaArr format: [
        //  {
        //   ..., // other props
        //    vendors: [
        //    {title: 'IMB', value: ''}, ...
        //   ]
        //   _vendorsIndex: {'IMB': <ref to vendors[0]>, ...} // added for fast access
        //  },
        //  ...
        // ]
        //
        var allVendors = [];
        var allIndex = {};
        _.forEach(criteriaArr, function (crit) {
            crit.vendors = crit.vendors || [];
            crit._vendorsIndex = {};

            _.forEach(crit.vendors, function (vendor) {
                var key = vendor.title; // must be unique!
                crit._vendorsIndex[key] = vendor;

                if (!allIndex[key]) {
                    allIndex[key] = true;
                    // TODO - order matters!
                    allVendors.push({
                        id: ['col', allVendors.length].join('_'),
                        field: key,
                        value: key,
                        vendor: true
                    });
                }
            });
        });
        return allVendors;
    }

    function findTopics() {
        // TODO -- order of topics changes on cell.save() - as it's in column order (kinda bad)
        var topicModel = selectColumns([
            { field: 'topic' }
        ]);
        var topics = [null];
        var found = {};
        _.forEach(topicModel.rows, function (row) {
            var topic = row[0].value; // topic cell is the only due to select
            if (topic && !found[topic]) {
                found[topic] = true;
                topics.push(topic);
            }
        });
        return topics;
    }

    function selectViewModel(specFn) {
        /**
         * var specFormat = [{
            selector: 'key_re', // or null (no model => virtual column)
            limit: 3, // optional
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
        var model = M.viewModel || buildViewModel(M.model);
        var spec = specFn(M.model); // get spec
        var res = {
            columns: [],
            rows: []
        };

        //Columns
        _.forEach(spec, function (item) {
            // each item in spec defines one or more columns to show on view
            var selectors = angular.isArray(item.selector) ? item.selector : [item.selector];
            var limit = item.limit;

            //first, select columns, for each selector in order
            var viewColumns = [];
            _.forEach(selectors, function (sel) {
                // find matching cols in ViewModel
                _.forEach(model.columns, function (col) {
                    if (!match(col, sel)) { return; }

                    var viewCol = {
                        model: col.model, // ref to model
                        id: col.id,
                        visible: true,
                        cellSpec: item.cell
                    };
                    // extend viewModel with requested props
                    angular.extend(viewCol, item.column);
                    viewColumns.push(viewCol);
                });
            });

            //limit resulting columns (limit is per item)
            if (limit) {
                viewColumns.splice(limit);
            }

            res.columns = [].concat(res.columns, viewColumns);
        });
        //console.log('>>>> SelModel:', JSON.stringify(res.columns, null, 4));

        //Rows - sorted!
        _.forEach(model.rows, function (row) {
            var viewRow = [];
            // pick the cells of the columns we just selected
            _.forEach(res.columns, function (col) {
                var cell = _.findWhere(row, {colId: col.id});
                var viewCell = {
                    model: cell.model,
                    id: cell.id,
                    visible: true
                };
                // extend viewModel with requested props
                angular.extend(viewCell, col.cellSpec);
                viewRow.push(viewCell);
            });
            res.rows.push(viewRow);
        });
        //console.log('>>>> SelModel:', JSON.stringify(res.rows, null, 4));

        return res;
        //////

        function match(col, sel) {
            // model may be:
            // {.., key: 'name'}, -> matched by 'name'
            // {.., key: '/vendors/IMB/value'} -> -> matched by '/vendors/.*?/value' // TODO: '/' in vendor title -- need to escape
            var re = new RegExp(sel);
            //console.log('>>>Matching', col, sel, re.test(col.key));
            return re.test(col.key);
        }
    }

    function selectColumns(predicate, limit) {
        // predicate format:
        // [ {key: 'val', k: 1}, {...}, ... ]
        // where:
        // each objects' keys are AND clause
        // array is OR clause
        //
        var res = {
            columns: [],
            rows: [],
            topics: model.topics
        };
        var test = function (col) {
            var res = false;
            _.forEach(predicate, function (obj) {
                var match = false;
                _.forEach(obj, function (v, k) {
                    //console.log('>>> match k,v,col=', k, v, col);
                    return (match = (col[k] === v));
                });
                if (match) {
                    return (res = true);
                }
            });
            return res;
        };
        var colIdx = {};

        _.forEach(model.columns, function (col) {
            if (test(col)) {
                res.columns.push(col);
            }
        });

        if (limit) {
            res.columns.splice(limit);
        }

        // index
        _.forEach(res.columns, function (col) {
            colIdx[col.field] = col; // unique!
        });

        _.forEach(model.rows, function (row) {
            var selRow = [];
            _.forEach(row, function (cell) {
                var col = cell.column;
                if (colIdx[col.field] === col) {
                    selRow.push(cell);
                }
            });
            res.rows.push(selRow);
        });

        return res;
    }

    // Traverse
    //

    function nextRowLike(cell, predicate) {
        var row = M.model.rows[cell.rowIdx() + 1];
        if (!row) { return null; }

        var crit = row[0].criteria;
        var alike = predicate ? (crit[predicate.key] === predicate.value) : true;

        return alike ? row : null;
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
        var newVal = cell.value;
        var patches = [];
        var needReload = false;

        if (!cell.column.vendor) {
            patches.push({
                op: cell.patch.op,
                path: cell.patch.path,
                value: newVal
            });
            console.log('Save non-vendor cell patch:', JSON.stringify(patches));

            // Update model - only when grouping can change
            if (/topic|priority/.test(cell.field)) {
                needReload = true;
                M.topics.rebuild();
            }

            // TODO - virtual cell (if any)
        }
        else if (cell.patch.op === 'replace') { // existing vendor
            patches.push({
                op: cell.patch.op,
                path: cell.patch.path,
                value: newVal
            });
            console.log('Save existing vendor cell patch:', JSON.stringify(patches));
        }
        else { // new vendor
            var newVendor = {
                title: cell.field,
                value: newVal
            };
            patches.push({
                op: cell.patch.op,
                path: cell.patch.path,
                value: newVendor
            });
            console.log('Save new vendor cell patch:', JSON.stringify(patches));

            // Update model
            var criteria = cell.criteria;
            criteria.vendors.push(newVendor);
            criteria._vendorsIndex[cell.field] = newVendor;
            var newPath = ['vendors', criteria.vendors.length - 1, 'value'].join('/');
            cell.patch = {
                op: 'replace',
                path: cell.patch.path.replace('vendors/-', newPath)
            };
            //console.log('>>new patch', cell.patch.path);
        }

        return {
            patches: patches,
            needReload: needReload
        };
    }

    function addRowLike(cell) {
        var newIdx = cell ? cell.rowIdx() + 1 : 0;
        var criteria = getCriteriaLike(cell ? cell.criteria : null);
        var patches = [];

        // Make patch
        patches.push({
            op: 'add',
            path: ['/criteria', newIdx].join('/'),
            value: criteria
        });
        console.log('Add row patch: ', JSON.stringify(patches));

        // Update model
        criteria._vendorsIndex = {};
        var newRow = buildRow(criteria, newIdx, true);
        M.model.rows.splice(newIdx, 0, newRow);

        return {
            patches: patches,
            needReload: true
        };
    }

    function getCriteriaLike(crit) {
        return {
            name: '',
            description: '',
            topic: crit ? crit.topic : null,
            priority: crit ? crit.priority : 'required',
            vendors: []
        };
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
        M.model.rows.splice(rowIdx, 1);
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

        _.forEach(M.model.rows, function (row, i) {
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
        var criteria = M.model.rows[0][0].criteria;
        criteria.vendors.push(newVendor);
        criteria._vendorsIndex[newVal] = newVendor;
        var col = {
            id: ['col', M.model.columns.length + 1].join('_'),
            field: newVal,
            value: newVal,
            vendor: true
        };
        M.model.columns.push(col);

        _.forEach(M.model.rows, function (row, i) {
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
        var colIdx = M.model.columns.indexOf(col);

        // update model & build patch
        _.forEach(M.model.rows, function (row, i) {
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
        M.model.columns.splice(colIdx, 1);

        return {
            patches: patches,
            needReload: true
        };
    }

    return M;
}
