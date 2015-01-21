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
    // Edit
    M.saveCell = saveCell;
    M.addRowLike = addRowLike;
    M.removeRow = removeRow;

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

    function buildRow(crit, idx) {
        var row = [];
        angular.forEach(M.model.columns, function (col) {
            var cell = {};
            var key = col.field;
            var vendor, vendorIdx;
            var model = {};
            if (!col.vendor) {
                model.obj = crit;
                model.key = key;
                model.path = key;
            }
            else if (vendor = crit._vendorsIndex[key]){
                vendorIdx = crit.vendors.indexOf(vendor);
                model.obj = vendor;
                model.key = 'value';
                model.path = ['vendors', vendorIdx, 'value'].join('/');
            } else { // no vendor yet
                model.obj = { title: key, value: '' };
                model.key = 'value';
                model.path = ['vendors', '-'].join('/');
            }

            var value = model.obj[model.key];
            cell.id = [key, idx].join('_');
            cell.field = key;
            cell.value = value;
            cell.path = ['/criteria', idx, model.path].join('/');
            cell.column = col;
            cell.criteria = crit;
            cell.rowIdx =  function () {
                return M.model.rows.indexOf(row); // changes
            };

            row.push(cell);
        });
        return row;
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
        var topicModel = selectColumns([{ field: 'group'}]);
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

    // Edits
    //

    function saveCell(cell) {
        var newVal = cell.value;
        var patches = [];
        var needReload = false;

        if (!cell.column.vendor) {
            patches.push({
                op: 'replace',
                path: cell.path,
                value: newVal
            });
            console.log('Save non-vendor cell patch:', JSON.stringify(patches));

            // Update model
            if (/group|priority/.test(cell.field)) {
                needReload = true;
                M.topics.rebuild();
            }

            // TODO - virtual cell (if any)
        }
        else {
            /*var vendor = criteria.vendorsIndex[cell.field];
             var vendorIdx = criteria.vendors.indexOf(vendor);
             if (vendor && vendor.value !== newVal) {
             vendor.value = newVal;

             patches.push({
             op: 'replace',
             path: ['/criteria', criteriaIdx, 'vendors', vendorIdx, 'value'].join('/'),
             value: newVal
             });
             console.log('Save exist cell patch:', JSON.stringify(patches));
             }
             else if (!vendor) {
             patches.push(addVendor(criteria, cell.field, newVal));
             console.log('Save new cell patch:', JSON.stringify(patches));
             }*/
        }

        return {
            patches: patches,
            needReload: needReload
        };
    }

    function addRowLike(cell) {
        var rowIdx = cell.rowIdx();
        var row = M.model.rows[rowIdx];
        var newIdx = rowIdx + 1;
        var criteria = getCriteriaLike(row[0].criteria);
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
        var newRow = buildRow(criteria, newIdx);
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

    /*function saveColumnModel(col, projectId) {
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

        console.log('Save column patch:', JSON.stringify(patches));
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
        console.log('Add column patch:', JSON.stringify(patches));

        // Update vendors model
        model.vendors.push({ title: newVal });

        patchCriteria(projectId, patches);
        reload();
    }
*/


    /*function addVendor(criteria, field, val) {
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

    function removeColumnModel(title, projectId) {
        var patches = [];

        // remove vendor from model.vendors
        model.vendors = $.map(model.vendors, function (vend) {
            return (vend.title === title) ? null : vend;
        });

        angular.forEach(model.criteria, function (crit, i) {
            var vendor = crit.vendorsIndex[title];
            var vendorIdx = crit.vendors.indexOf(vendor);
            if (vendor) {
                crit.vendors = crit.vendors.splice(vendorIdx, 1);
                delete crit.vendorsIndex[title];

                patches.push({
                    op: 'remove',
                    path: ['/criteria', i, 'vendors', vendorIdx].join('/')
                });
            }
        });
        console.log('Remove column patch:', JSON.stringify(patches));

        patchCriteria(projectId, patches);
        reload();
    }*/


    return M;
}
