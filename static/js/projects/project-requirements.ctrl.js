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
            title: '',
            field: '',
            visible: true,
            sortable: false,
            cellType: 'popup'
        });

        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = getRow(crit);
            data.rows.push(row);
        });

        // Empty table -> invite to edit
        if (!model.criteria.length) {
            var row = getRow(getCriteriaLike(null));
            row.edit = 'name';
            data.rows.push(row);
        }

        // Expose topics:
        data.topics = model.topics;
        return data;


        function getRow(crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                var cell = row[col.field] = {};
                cell.type = col.cellType;
                cell.value = crit[col.field] || '';

                if (cell.type === 'multiline') {
                    cell.criteria = crit; // for save
                    cell.field = col.field;
                }
                else if (cell.type === 'popup') {
                    cell.criteria = crit;
                    cell.noMenu = true;
                    cell.edit = {
                        priority: crit.priority,
                        topic: crit.group
                    };
                    // cell.field is set dynamically as popup manages several props
                }
            });
            return row;
        }
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

    // TODO
    //m.savingData = false;
    //m.groupBy = 'group';
    //m.groupByTitle = groupByTitle;

    // Edit cell
    m.criteriaKeyPressed = criteriaKeyPressed;
    // Menu
    //m.criteriaOfMenu = null;
    //m.setCriteriaOfMenu = setCriteriaOfMenu;
    //m.menuAddCriteria = menuAddCriteria;
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
