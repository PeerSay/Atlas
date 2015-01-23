/*global angular:true*/

angular.module('peersay')
    .factory('TableModel', TableModel);

TableModel.$inject = [];
function TableModel() {
    var M = {};
    var model = M.model = {
        columns: [],
        rows: []
    };
    M.buildModel = buildModel;
    M.selectColumns = selectColumns;
    M.topics = {
        all: [],
        rebuild: function () {
            this.all = findTopics();
        }
    };
    M.nextRowLike = nextRowLike;
    M.isUniqueCol = isUniqueCol;
    // Edit
    M.saveCell = saveCell;
    M.addRowLike = addRowLike;
    M.removeRow = removeRow;
    M.saveColumn = saveColumn;
    M.addColumn = addColumn;
    M.removeColumn = removeColumn;

    function buildModel(data) {
        // Server data format:
        // [{
        //  name: '',
        //  description: '',
        //  group: '', // TODO: topic
        //  description: '',
        //  vendors: [
        //   { title: '', value: '', ??? },
        //   ...
        //  ]
        // },
        // ...
        // ]

        // Columns
        var columns = [
            {field: 'name', value: 'Criteria'},
            {field: 'description', value: 'Description'},
            {field: 'group', value: 'Topic'},
            {field: 'priority', value: 'Priority'}
        ];
        model.columns = columns.concat(indexVendors(data));

        // Rows
        var rows = [];
        angular.forEach(data, function (crit, i) {
            var row = buildRow(crit, i);
            rows.push(row);
        });

        // TODO - virtual rows / cols?
        model.rows = rows;
        M.topics.rebuild(); // XXX
        return model;
    }

    function buildRow(crit, idx, justAdded) {
        var row = [];
        angular.forEach(M.model.columns, function (col) {
            var cell = buildCell(col, row, idx, crit);
            if (justAdded && cell.field === 'name') {
                cell.justAdded = true;
            }
            row.push(cell);
        });
        return row;
    }

    function buildCell(col, row, idx, crit) {
        var cell = {};
        var key = col.field;
        var vendor, vendorIdx;
        var model = {};
        if (!col.vendor) {
            model.obj = crit;
            model.key = key;
            model.path = key;
            model.op = 'replace';
        }
        else if (vendor = crit._vendorsIndex[key]) {
            vendorIdx = crit.vendors.indexOf(vendor);
            model.obj = vendor;
            model.key = 'value';
            model.path = ['vendors', vendorIdx, 'value'].join('/');
            model.op = 'replace';
        } else { // no vendor yet
            model.obj = { title: key, value: '' };
            model.key = 'value';
            model.path = ['vendors', '-'].join('/');
            model.op = 'add';
        }

        var value = model.obj[model.key];
        cell.id = [key, idx].join('_');
        cell.field = key;
        cell.value = value;
        cell.patch = {
            op: model.op,
            path: ['/criteria', idx, model.path].join('/')
        };
        cell.column = col;
        cell.criteria = crit;
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
        angular.forEach(criteriaArr, function (crit) {
            crit.vendors = crit.vendors || [];
            crit._vendorsIndex = {};

            angular.forEach(crit.vendors, function (vendor) {
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
            { field: 'group'}
        ]);
        var topics = [null];
        var found = {};
        angular.forEach(topicModel.rows, function (row) {
            var topic = row[0].value; // topic cell is the only due to select
            if (topic && !found[topic]) {
                found[topic] = true;
                topics.push(topic);
            }
        });
        return topics;
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
            angular.forEach(predicate, function (obj) {
                var match = false;
                angular.forEach(obj, function (v, k) {
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

        angular.forEach(model.columns, function (col) {
            if (test(col)) {
                res.columns.push(col);
            }
        });

        if (limit) {
            res.columns.splice(limit);
        }

        // index
        angular.forEach(res.columns, function (col) {
            colIdx[col.field] = col; // unique!
        });

        angular.forEach(model.rows, function (row) {
            var selRow = [];
            angular.forEach(row, function (cell) {
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
        angular.forEach(model.columns, function (col) {
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
            if (/group|priority/.test(cell.field)) {
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
            group: crit ? crit.group : null,
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

        angular.forEach(M.model.rows, function (row, i) {
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

        angular.forEach(M.model.rows, function (row, i) {
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
        angular.forEach(M.model.rows, function (row, i) {
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
