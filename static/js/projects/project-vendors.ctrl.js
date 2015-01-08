angular.module('peersay')
    .controller('ProjectVendorsCtrl', ProjectVendorsCtrl);

ProjectVendorsCtrl.$inject = ['$scope', '$filter', '$timeout', '$q', 'Tiles', 'Projects', 'Table'];
function ProjectVendorsCtrl($scope, $filter, $timeout, $q, Tiles, Projects, Table) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
    m.progress = {
        value: 0,
        total: 1
    };
    // Full view
    m.fullView = Tiles.fullView;
    m.showFullView = showFullView;
    m.onFullView = onFullView;


    // Table views
    m.normalTableView = Table.addView(m.projectId, 'vi-norm', toNormViewData)
        //.debug() // opt
        .grouping() // xxx
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m.projectId, 'vi-full', toFullViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData(model) {
        var data = {
            columns: [],
            rows: []
        };
        // Columns: Prod1, [Prod2, Prod3]
        angular.forEach(model.vendors, function (vendor, i) {
            data.columns.push({
                title: vendor.title,
                field: vendor.title,
                visible: i < 3 // hide all but first 3; TODO - remove from arr?
            });
        });
        // Rows
        angular.forEach(model.criteria, function (criteria) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                row[col.field] = criteria.vendorsIndex[col.field];
            });
            data.rows.push(row);
        });

        return data;
    }

    function toFullViewData(model) {
        var data = {
            columns: [],
            rows: []
        };
        // Columns: Prod1, [Prod2, Prod3]
        data.columns.push({
            title: 'Criteria',
            field: 'name',
            visible: true
        });
        // Group & priority are required for grouping to work (hidden)
        data.columns.push({
            title: '--',
            field: 'group',
            visible: false
        });
        data.columns.push({
            title: '--',
            field: 'priority',
            visible: false
        });
        angular.forEach(model.vendors, function (vendor) {
            data.columns.push({
                title: vendor.title,
                field: vendor.title,
                visible: true,
                editable: true,
                edit: {
                    show: false,
                    value: vendor.title
                }
            });
        });
        // Last column is Add New
        data.columns.push({
            title: '...',
            field: '--', // TODO: unique!
            visible: true,
            virtual: true,
            editable: true,
            edit: {
                show: false,
                value: ''
            }
        });
        // Rows
        angular.forEach(model.criteria, function (criteria) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                if (col.virtual) {
                    row[col.field] = {
                        type: 'static',
                        value: ''
                    };
                }
                else if (col.editable) {
                    row[col.field] = {
                        type: 'number',
                        value: criteria.vendorsIndex[col.field]
                    };
                }
                else if (col.visible) {
                    row[col.field] = {
                        type: 'static',
                        value: criteria[col.field]
                    };
                }
                else {
                    row[col.field] = criteria[col.field];
                }

            });
            data.rows.push(row);
        });

        return data;
    }

    // Grouping
    m.groupBy = Table.groupBy;


    /////////////////////////////

    //TODO:
    // Model update+cache
    //m.criteriaStr = null;
    //m.updateModel = updateModel;
    //m.savingData = false; // show indicator

    // Handle virtual cells
    //m.isEmptyTable = isEmptyTable;

    //m.compactTable = false; // needed?

    // Handle popover
    //m.popoverOn = null;

    // Editing cells
    //m.criteriaKeyPressed = criteriaKeyPressed;
    // Menu
    m.criteriaOfMenu = null;
    m.setCriteriaOfMenu = setCriteriaOfMenu;
    m.menuAddCriteria = menuAddCriteria;
    m.menuRemoveCriteria = menuRemoveCriteria;


    activate();

    function activate() {
        Tiles.setProgress(m.tile, m.progress); // TODO - what is progress??
        $scope.$on('$destroy', function () {
            m.progress = { value: 0, total: 0 };
            Tiles.setProgress(m.tile, m.progress);
        });
    }

    function showFullView(control) {
        Tiles.toggleFullView(true, m.tile.uri, control);
    }

    function onFullView() {
        //console.log('>> onFullView');
        //autoFocus();
    }

    function autoFocus() {
        var focusCriteria = m.criteria[0]; //TODO - get clicked criteria to focus
        //console.log('>>autoFocus', focusCriteria);

        if (focusCriteria) {
            focusCriteria.edit = 'name'; // invite to edit
        }
    }

    // Data
    //
    function readModel() {
        var loadedQ = $q(function (resolve) {
            resolve();
        });

        // TODO - should be handled by cache in Projects, but now it gets off-sync
        // due to empty rows.
        return m.loaded ? loadedQ : Projects.readProjectCriteria(m.projectId)
            .then(function (res) {
                m.loaded = true;
                m.criteria = res.criteria;
                // XXX
                m.criteria[0].vendors = {
                    'IBM': 1,
                    'Some other': 22,
                    'XP': 123
                };

                m.criteriaStr = JSON.stringify({ criteria: m.criteria });

                if (m.criteria.length) {
                    m.vendors = findVendors();
                } else {
                    m.vendors.push({
                        title: '', // invite
                        visible: true
                    });
                }

                console.log('>>> Loaded model', m.criteria, m.vendors);
                buildModel();
                console.log('>>> Built model', m.model);
                console.log('>>> Built model str:\n', toString());
            });
    }

    function buildModel() {
        // headers
        m.model.headers = [];
        m.model.headers.push({ title: 'Criteria' });
        angular.forEach(m.vendors, function (vendor) {
            m.model.headers.push({ title: vendor.title });
        });

        // rows
        m.model.rows = [];
        angular.forEach(m.criteria, function (criteria) {
            var row = [];
            row.push({
                value: criteria.name,
                static: true
            });
            angular.forEach(m.vendors, function (vendor) {
                row.push({
                    value: criteria.vendors[vendor.title] || '',
                    editable: 'number'
                });
            });
            m.model.rows.push(row);
        });
    }

    function toString() {
        var res = '';
        var pads = [];
        var arr = [];
        arr.push(rowArr(m.model.headers, 'title'));

        angular.forEach(m.model.rows, function (row) {
            arr.push(rowArr(row, 'value'));
        });

        angular.forEach(arr, function (row, i) {
            res += rowStr(row, i ? '-' : '=') + '\n';
        });

        function rowArr(arr, prop) {
            return $.map(arr, function (obj, i) {
                var str = obj[prop] + '';
                pads[i] = Math.max(str.length, pads[i] || 0);
                return str;
            });
        }

        function rowStr(arr, delim) {
            var res = $.map(arr, function (str, i) {
                return str + times(' ', pads[i] - str.length);
            }).join('|');
            res += '\n' + times(delim, res.length);
            return res;
        }

        function times(char, num) {
            return Array(num + 1).join(char);
        }

        return res;
    }

    function findVendors() {
        var vendors = [];
        var found = {};
        angular.forEach(m.criteria, function (crit) {
            if (!crit.vendors) {
                crit.vendors = {};
                return;
            }
            angular.forEach(crit.vendors, function (v, k) {
                if (!found[k]) {
                    found[k] = true;
                    vendors.push({
                        title: k,
                        visible: true
                    });
                }
            });
        });
        console.log('>> vendors', vendors);
        return vendors;
    }

    function updateModel() {
        var data = prepareModel();
        if (!data) { return; } // unmodified

        var delayPromise = $timeout(function () {
        }, 300, false);
        var requestPromise = $q(function (resolve) {
            Projects.updateProjectCriteria(m.projectId, data)
                .finally(resolve);
        });

        m.savingData = true;
        $q.all([delayPromise, requestPromise])
            .then(function () {
                m.savingData = false;
            });
    }

    function prepareModel() {
        var res = {criteria: []};
        angular.forEach(pruneEmpty(m.criteria), function (crit) {
            res.criteria.push({
                name: crit.name,
                description: crit.description,
                priority: crit.priority,
                group: crit.group
            });
        });

        var str = JSON.stringify(res);
        var changed = (m.criteriaStr !== str);
        m.criteriaStr = str;

        return changed ? res : null;
    }

    function pruneEmpty(arr) {
        return $.map(arr, function (crit) {
            if (!crit.name && !crit.description) {
                return null;
            }
            return crit;
        });
    }

    // Ng-table handling
    //
    function reloadTables(save) {
        m.normTableParams.reload();
        m.fullTableParams.reload();

        if (save) {
            updateModel();
        }
    }

    function tableGetData($defer, params) {
        var orderByArr = params.orderBy();
        var orderBy = orderByArr[0];
        var orderByGroup = m.groupBy &&
            orderBy ? m.groupBy !== orderBy.substring(1) : true;
        if (orderByGroup) {
            orderByArr.unshift(m.groupBy);
        }

        readModel()
            .then(function () {
                //console.log('>>Data reload, orderBy, groupBy', orderByArr, m.groupBy);
                m.criteria = $filter('orderBy')(m.criteria, orderByArr);
                params.total(m.criteria.total);
                $defer.resolve(m.criteria);
            });
    }

    function isEmptyTable() {
        var len = m.criteria.length;
        var virtual = (len === 1 && m.criteria[0]);
        var onlyVirtual = (virtual && !virtual.name && !virtual.description);
        return !len || onlyVirtual;
    }

    // Grouping / sorting
    //
    function groupByTitle() {
        var title = $filter('capitalize')(m.groupBy || 'null'); // null => hide column
        var hide = (title === 'Null' || isEmptyTable());
        return hide ? null : title;
    }

    function tableSortClass(tableParams, by) {
        return {
            'sort-asc': tableParams.isSortBy(by, 'asc'),
            'sort-desc': tableParams.isSortBy(by, 'desc')
        };
    }

    function tableSortClick(tableParams, by) {
        var sortOrder = {};
        sortOrder[by] = tableParams.isSortBy(by, 'asc') ? 'desc' : 'asc';
        tableParams.sorting(sortOrder);
    }

    // Criteria group
    function groupKeyPressed(criteria, evt) {
        //console.log('>>Key pressed for[%s] of [%s]', criteria.name, criteria.newGroup, evt.keyCode);

        if (evt.keyCode === 13) {
            if (criteria.newGroup.value) {
                criteria.group = criteria.newGroup.value;
                if (m.groups.indexOf(criteria.group) < 0) {
                    m.groups.push(criteria.group);
                }
                reloadTables(true);
            }
            groupDone(criteria);
            return;
        }
        if (evt.keyCode === 27) {
            groupDone(criteria);
            return evt.preventDefault();
        }
    }

    function groupDone(criteria) {
        criteria.newGroup = {};
        m.popoverOn = null;
    }

    function setCriteriaGroup(criteria, group) {
        criteria.group = group;
        reloadTables(true);
    }

    // Edit
    //
    function nextCriteriaLike(criteria) {
        var criteriaIdx = m.criteria.indexOf(criteria);
        var next = m.criteria[criteriaIdx + 1];
        if (!next) {
            return null;
        }

        var alike = false;
        if (!m.groupBy) {
            alike = (next.group === criteria.group &&
                next.priority === criteria.priority);
        } else {
            alike = (next[m.groupBy] === criteria[m.groupBy]);
        }

        return alike ? next : null;
    }

    function addCriteriaLike(crit) {
        var added = {
            name: '',
            description: '',
            group: crit ? crit.group : null,
            priority: crit ? crit.priority : 'required',
            edit: 'name'
        };
        //console.log('>>adding', added);

        if (crit) {
            var idx = m.criteria.indexOf(crit);
            m.criteria.splice(idx + 1, 0, added);
        }
        else {
            m.criteria.push(added);
        }
        reloadTables(true);
        return added;
    }

    function removeCriteria(crit) {
        var idx = m.criteria.indexOf(crit);
        var removed = m.criteria.splice(idx, 1);
        reloadTables(true);

        if (!m.criteria.length) {
            addCriteriaLike(null); // never leave empty table
            autoFocus();
        }
        return removed;
    }

    function criteriaKeyPressed(criteria, evt) {
        //console.log('>>Key pressed for[%s] of [%s]', criteria.name, criteria.edit, evt.keyCode);

        // TODO - filter out shift
        if (evt.keyCode === 9) { // TAB
            var next = nextCriteriaLike(criteria);
            //console.log('>>next', next);
            if (!next) {
                addCriteriaLike(criteria);
                return evt.preventDefault();
            }
        }
    }

    // Menu
    //
    function setCriteriaOfMenu(criteria) {
        // cannot pass as param to add/remove call because
        // a) menu position is broken when placed inside ps-table
        // b) would require new menu elem for every table row
        m.criteriaOfMenu = criteria;
    }

    function menuAddCriteria() {
        if (!m.criteriaOfMenu) { return; }

        // delay to allow context-menu event handler to close menu,
        // otherwise it remains open
        $timeout(function () {
            // find last criteria in group
            var prev = m.criteriaOfMenu, next;
            while (next = nextCriteriaLike(prev)) {
                prev = next;
            }

            addCriteriaLike(prev);
            m.criteriaOfMenu = null;
        }, 0, false);
    }

    function menuRemoveCriteria() {
        if (!m.criteriaOfMenu) { return; }

        $timeout(function () {
            removeCriteria(m.criteriaOfMenu);
            m.criteriaOfMenu = null;
        }, 0, false);
    }
}
