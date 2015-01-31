angular.module('peersay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table', 'TableModel', 'Util'];
function ProjectRequirementsCtrl($scope, $timeout, Tiles, Table, TableModel, _) {
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

    m.normalTableView = Table.addView(m, 'ev-norm', getNormalViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'ev-full', getFullViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function getNormalViewConfig() {
        // Columns: Criteria
        return [
            {
                selector: 'name',
                cell: {
                    type: 'ordinary',
                    emptyValue: 'No name?'
                }
            }
        ];
    }

    function getFullViewConfig() {
        // Columns: Criteria, Description, [Topic, Priority], {empty}
        var spec =  [
            {
                selector: ['name', 'description'],
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'multiline'
                }
            },
            // <-- here goes topic & priority if not compactTable
            /*{
                selector: null, // virtual
                models: { //edits 2 models
                    topic: true,
                    priority: true //XXX
                },
                column: {
                    last: true
                },
                cell: {
                    editable: true,
                    type: 'popup'
                }
            }*/
        ];
        if (!m.compactTable) {
            spec.splice(1, 0, {
                    selector: ['topic', 'priority'],
                    column: {
                        sortable: true
                    },
                    cell: {
                        type: 'static'
                    }
                }
            );
        }

        return spec;
    }

    /////////////////////////////////////////

    function toNormViewData() {
        var groupBy = m.groupBy.get();
        var model = TableModel.selectColumns([
            { field: 'name' },
            {field: groupBy}
        ]);
        var data = {
            columns: [],
            rows: []
        };

        // Columns: Criteria, [Topic|Priority](hidden - need for grouping)
        _.forEach(model.columns, function (col) {
            data.columns.push({
                model: col,
                visible: (col.field === 'name'),
                editable: false,
                sortable: false
            })
        });

        //Rows
        _.forEach(model.rows, function (row) {
            var resRow = [];
            _.forEach(row, function (cell, i) {
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

    function toFullViewData() {
        var model = TableModel.selectColumns([
            { field: 'name' },
            {field: 'description'},
            {field: 'topic'},
            {field: 'priority'}
        ]);
        var data = {
            columns: [],
            rows: []
        };

        // Columns: Criteria, Description, [Topic, Priority], <empty>
        _.forEach(model.columns, function (col) {
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
        _.forEach(model.rows, function (row) {
            var resRow = [];
            _.forEach(row, function (cell, i) {
                resRow.push({
                    model: cell,
                    visible: data.columns[i].visible,
                    editable: filter(/name|description/)(cell.field),
                    type: cellType(cell.field),
                    justAdded: cell.justAdded
                });
                delete cell.justAdded;
            });
            // last row -- popoup
            resRow.push({
                model: {}, // not used view, but accessed by groupBy()
                models: { //edits 2 models
                    topic: row[2],
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
            return !filter(/topic|priority/)(col.field); // hide topic/priority in compact view
        }

        function cellType(val) {
            if (filter(/name|description/)(val)) {
                return 'multiline';
            }
            if (filter(/topic|priority/)(val)) {
                return 'static';
            }
        }

        function filter(re) {
            return function (val) {
                return re.test(val);
            }
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
        enabled: menuItemEnabled,
        doAction: menuDoAction
    };
    m.fullTableView.menu = m.menu; // expose to Table directive

    function menuDoAction(action) {
        if (!this.enabled(action)) { return; }

        var view = this.view;
        var cell = this.context.cell;

        // delay to allow context-menu event handler to close menu,
        // otherwise it remains open
        $timeout(function () {
            if (action === 'remove') {
                view.removeRow(cell.model);
            }
            else if (action === 'add') {
                view.addRowLike(cell.model);
            }
        }, 0, false);

    }

    function menuItemEnabled(item) {
        if (item === 'remove') {
            return (this.view.rows.length > 1);
        }
        return true;
    }


    //////////////////////////////////////////////////////////

    // TODO
    //m.savingData = false;
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
        var rows = m.fullTableView.rows;
        if (rows.length === 1) {
            rows[0][0].justAdded = 1;
        }
    }
}
