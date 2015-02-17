angular.module('peersay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table'];
function ProjectRequirementsCtrl($scope, $timeout, Tiles, Table) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
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
            {
                selector: null, // virtual
                cellModels: ['topic', 'priority'], // cell edits 2 models
                column: {
                    last: true
                },
                cell: {
                    editable: true,
                    type: 'popup',
                    noMenu: true
                }
            }
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
                view.removeRow(cell);
            }
            else if (action === 'add') {
                view.addRowLike(cell);
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


    function showFullView(control) {
        Tiles.toggleFullView(true, m.tile.uri, control);
    }

    function onFullView() {
        var rows = m.fullTableView.rows;
        if (rows.length === 1) {
            rows[0][0].justAdded = true; // TODO - fix
        }
    }
}
