angular.module('peersay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$filter', '$timeout', '$q', 'Tiles', 'ngTableParams', 'Table'];
function ProjectRequirementsCtrl($scope, $filter, $timeout, $q, Tiles, ngTableParams, Table) {
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
    m.groupBy = Table.groupBy;
    m.compactTable = false;
    m.reloadTables = Table.reload.bind(Table);

    m.normalTableView = Table.addView(m.projectId, 'ev-norm', toNormViewData)
        //.debug() // opt
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m.projectId, 'ev-full', toFullViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData(model) {
        var data = {
            columns: [],
            rows: []
        };
        // Columns: Criteria, [Topic|Priority]
        data.columns.push({
            title: 'Criteria',
            field: 'name',
            visible: true
        });
        data.columns.push({
            title: 'Topic',
            field: 'group',
            visible: (m.groupBy.get() === 'group')
        });
        data.columns.push({
            title: 'Priority',
            field: 'priority',
            visible: (m.groupBy.get() === 'priority')
        });

        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                row[col.field] = {
                    value: crit[col.field]
                };
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
        // Columns: Criteria, Description, [Topic, Priority], <empty>
        data.columns.push({
            title: 'Criteria',
            field: 'name',
            visible: true,
            sortable: true,
            cellType: 'multiline'
        });
        data.columns.push({
            title: 'Description',
            field: 'description',
            visible: true,
            sortable: true,
            cellType: 'multiline'
        });
        data.columns.push({
            title: 'Topic',
            field: 'group',
            visible: !m.compactTable,
            sortable: true,
            cellType: 'static'
        });
        data.columns.push({
            title: 'Priority',
            field: 'priority',
            visible: !m.compactTable,
            sortable: true,
            cellType: 'static'
        });
        data.columns.push({
            title: '--',
            field: '',
            visible: true,
            sortable: false,
            cellType: 'static'
        });

        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                var cell = row[col.field] = {};
                cell.type = col.cellType;
                cell.value = crit[col.field] || '';

                if (cell.type === 'multiline') {
                    cell.criteria = crit; // for save
                    cell.field = col.field;
                }
            });
            data.rows.push(row);
        });

        // Empty table -> invite to edit
        if (!model.criteria.length) {
            var row = {};
            var criteria = getCriteriaLike(null);
            angular.forEach(data.columns, function (col) {
                var cell = row[col.field] = {};
                cell.type = col.cellType;
                cell.value = criteria[col.field] || '';
                row.edit = 'name';

                if (cell.type === 'multiline') {
                    cell.criteria = criteria; // for save
                    cell.field = col.field;
                }
            });
            data.rows.push(row);
        }

        return data;
    }

    //Menu
    m.menu = {
        context: null,
        view: m.fullTableView,
        setContext: function (context) {
            this.context = context;
        },
        addCriteriaLike: menuAddCriteriaLike,
        removeCriteria: menuRemoveCriteria
    };
    m.fullTableView.menu = m.menu; // expose to Table directive

    function menuAddCriteriaLike() {
        var view = this.view;
        var cell = this.context.cell;
        var newCriteria = getCriteriaLike(cell.criteria);

        $timeout(function () {
            view.addRow(cell, newCriteria);
        }, 0, false);
    }

    function menuRemoveCriteria() {
        var view = this.view;
        var cell = this.context.cell;

        $timeout(function () {
            view.removeRow(cell);
        }, 0, false);
    }

    function getCriteriaLike(crit) {
        var criteria = {
            name: '',
            description: '',
            group: crit ? crit.group : null,
            priority: crit ? crit.priority : 'required',
            vendors: []
        };
        return criteria;
    }

    //////////////////////////////////////////////////////////

    // Data model
    m.criteria = [];
    m.criteriaStr = null;
    m.groups = [];
    m.updateModel = updateModel;
    // Table settings
    var tableSettings = {
        //debugMode: true,
        counts: [],
        total: 0,
        getData: tableGetData
    };
    //m.normTableParams = new ngTableParams({ count: 10 }, tableSettings);
    /*m.fullTableParams = new ngTableParams({ count: 10 }, angular.extend(tableSettings, {
     groupBy: function (item) {
     return item[m.groupBy];
     }
     }));*/
    m.isEmptyTable = isEmptyTable;
    // General
    m.titles = ['Criteria', 'Description', 'Group', 'Priority'];
    //m.compactTable = false;
    m.popoverOn = null;
    m.savingData = false;
    // Grouping
    m.groupByOptions = [
        null,
        'group',
        'priority'
    ];
    //m.groupBy = 'group';
    m.groupByTitle = groupByTitle;
    m.selectGroupBy = selectGroupBy;
    // Sorting
    m.tableSortClass = tableSortClass;
    m.tableSortClick = tableSortClick;
    // Edit groups
    m.setCriteriaGroup = setCriteriaGroup;
    m.newGroup = {
        edit: false,
        value: ''
    };
    m.groupKeyPressed = groupKeyPressed;
    m.groupDone = groupDone;
    // Edit cell
    m.criteriaKeyPressed = criteriaKeyPressed;
    // Menu
    m.criteriaOfMenu = null;
    m.setCriteriaOfMenu = setCriteriaOfMenu;
    m.menuAddCriteria = menuAddCriteria;
    //m.menuRemoveCriteria = menuRemoveCriteria;


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
        return Table.readCriteria(m.projectId)
            .then(function (res) {
                m.criteria = res.criteria;
                m.criteriaStr = res.criteriaStr;
                m.groups = res.groups;

                if (!m.criteria.length) {
                    addCriteriaLike(null);
                }
                //console.log('>>> Loaded model', m.criteria);
            });
    }

    function updateModel() {
        var data = prepareModel();
        if (!data) { return; } // unmodified

        var delayPromise = $timeout(function () {
        }, 300, false);
        var requestPromise = $q(function (resolve) {
            Table.updateCriteria(m.projectId, data)
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

    function selectGroupBy(by) {
        m.groupBy = by;
        reloadTables();
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

    function removeCriteria2(crit) {
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

    function menuRemoveCriteria2() {
        if (!m.criteriaOfMenu) { return; }

        $timeout(function () {
            removeCriteria2(m.criteriaOfMenu);
            m.criteriaOfMenu = null;
        }, 0, false);
    }
}
