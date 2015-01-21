angular.module('peersay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table', 'TableModel'];
function ProjectRequirementsCtrl($scope, $timeout, Tiles, Table, TableModel) {
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
        .grouping()
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'ev-full', toFullViewData2)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData() {
        var groupBy = m.groupBy.get();
        var model = TableModel.selectColumns([{ field: 'name' }, {field: groupBy}]);
        var data = {
            columns: [],
            rows: []
        };
        // todo:
        /*var data2 = TableModel.select([
            {
                selector: { field: 'name' },
                props: {
                    visible: true
                }
            }, {
                selector: {field: groupBy},
                props: {
                    visible: false
                }
            }
        ]);*/

        // Columns: Criteria, [Topic|Priority](hidden - need for grouping)
        angular.forEach(model.columns, function (col) {
            data.columns.push({
                model: col,
                visible: (col.field === 'name'),
                editable: false,
                sortable: false
            })
        });

        //Rows
        angular.forEach(model.rows, function (row) {
            var resRow = [];
            angular.forEach(row, function (cell, i) {
                resRow.push({
                    model: cell,
                    visible: data.columns[i].visible,
                    editable: false,
                    type: 'ordinary',
                    emptyValue: 'No name?'
                });
            });
            data.rows.push(resRow);
        });

        return data;
    }

    function toFullViewData2() {
        var model = TableModel.selectColumns([
            { field: 'name' }, {field: 'description'}, {field: 'group'}, {field: 'priority'}
        ]);
        var data = {
            columns: [],
            rows: []
        };

        // Columns: Criteria, Description, [Topic, Priority], <empty>
        angular.forEach(model.columns, function (col) {
            data.columns.push({
                model: col,
                visible: isVisibleCol(col),
                editable: false,
                sortable: true
            })
        });
        // last is empty
        data.columns.push({
            model: {}, // TODO
            visible: true,
            editable: false,
            sortable: false,
            last: true
        });

        //Rows
        angular.forEach(model.rows, function (row) {
            var resRow = [];
            angular.forEach(row, function (cell, i) {
                resRow.push({
                    model: cell,
                    visible: data.columns[i].visible,
                    editable: filter(/name|description/)(cell.field),
                    type: cellType(cell.field)
                });
            });
            // last row -- popoup
            resRow.push({
                model: {}, // not used view, but accessed by groupBy()
                models: { //edits 2 models
                    group: row[2],
                    priority: row[3]
                },
                visible: true,
                editable: true,
                type: 'popup',
                noMenu: true
            });
            data.rows.push(resRow);
        });

        return data;

        function isVisibleCol(col) {
            if (!m.compactTable) { return true; }
            return !filter(/group|priority/)(col.field); // hide group/priority in compact view
        }

        function cellType(val) {
            if (filter(/name|description/)(val)) {
                return 'multiline';
            }
            if (filter(/group|priority/)(val)) {
                return 'static';
            }
        }

        function filter(re) {
            return function (val) {
                return re.test(val);
            }
        }
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
            view.addRowLike(cell.model);
        }, 0, false);
    }

    function menuRemoveCriteria() {
        var view = this.view;
        var cell = this.context.cell;

        $timeout(function () {
            view.removeRow(cell.model);
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
