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

    m.normalTableView = Table.addView(m, 'ev-norm', toNormViewData)
        //.debug() // opt
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'ev-full', toFullViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData(model) {
        var data = {
            columns: [],
            rows: []
        };
        var groupBy = m.groupBy.get();
        // Columns: Criteria, [Topic|Priority]
        data.columns.push({
            title: 'Criteria',
            field: 'name',
            visible: true,
            cellType: 'html-multiline-noempty'
        });
        data.columns.push({
            title: 'Topic',
            field: 'group',
            visible: (groupBy === 'group')
        });
        data.columns.push({
            title: 'Priority',
            field: 'priority',
            visible: (groupBy === 'priority')
        });

        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                row[col.field] = {
                    value: crit[col.field],
                    type: col.cellType,
                    emptyValue: 'No name?'
                };
            });
            data.rows.push(row);
        });

        return data;
    }

    function toFullViewData(model) {
        var data = {
            columns: [],
            rows: [],
            topics: model.topics // expose topics for Popover
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
        angular.forEach(model.criteria, function (crit, i) {
            var row = getRow(crit, i);
            if (crit.justAdded) {
                row.edit = 'name';
                crit.justAdded = false;
            }
            data.rows.push(row);
        });

        // Empty table -> invite to edit
        if (!model.criteria.length) {
            var row = getRow(Table.getModelLike(null));
            row.edit = 'name';
            data.rows.push(row);
        }

        return data;


        function getRow(crit, idx) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                var cell = row[col.field] = {};
                cell.type = col.cellType;
                cell.value = crit[col.field] || '';

                if (cell.type === 'multiline') {
                    cell.criteria = crit; // for save
                    cell.field = col.field;
                    cell.inputId = col.field + idx;
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
        id: 'er-context-menu',
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

        $timeout(function () {
            view.addRowLike(cell);
        }, 0, false);
    }

    function menuRemoveCriteria() {
        var view = this.view;
        var cell = this.context.cell;

        $timeout(function () {
            view.removeRow(cell);
        }, 0, false);
    }


    //////////////////////////////////////////////////////////

    // TODO
    //m.savingData = false;
    //m.groupBy = 'group'; -> Topic
    //m.groupByTitle = groupByTitle; -> Uppercase

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
        //TODO - autoFocus();
    }
}
