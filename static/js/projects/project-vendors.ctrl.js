angular.module('peersay')
    .controller('ProjectVendorsCtrl', ProjectVendorsCtrl);

ProjectVendorsCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table'];
function ProjectVendorsCtrl($scope, $timeout, Tiles, Table) {
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

    m.normalTableView = Table.addView(m, 'vi-norm', getNormalViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'vi-full', getFullViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function getNormalViewConfig(model) {
        // Columns: Prod1, [Prod2, Prod3] | {Products}
        var res = [
            {
                selector: 'vendors/.*?/input',
                limit: 3,
                cell: {
                    type: 'ordinary'
                }
            }
        ];

        var vendors = model.vendors;
        if (!vendors.length) {
            res.push({
                selector: null,
                columnModel: { field: 'Products', value: 'Products'}, // show at least on column
                cellModels: ['name'] // first cell is used for grouping and must have criteria
            });
        }
         return res;
    }

    function getFullViewConfig() {
        // Columns: Criteria, Prod1, [Prod2, Prod3, ...], {AddNew}
        return [
            {
                selector: 'name',
                column: {
                    sortable: true
                },
                cell: {
                    type: 'static'
                }
            },
            {
                selector: 'vendors/.*?/input',
                column: {
                    editable: true,
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'multiline'
                }
            },
            {
                selector: null, // virtual
                columnModel: { field: '...', value: ''}, // addNew
                column: {
                    editable: true,
                    placeholder: 'Add product...',
                    last: true
                },
                cell: {
                    type: 'static'
                }
            }
        ];
    }

    //Menu
    m.menu = {
        id: 'vi-context-menu',
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

        $timeout(function () {
            if (action === 'remove') {
                view.removeColumn(cell.model);
            }
            else if (action === 'add'){
                inviteToEdit(view);
            }
        }, 0, false);
    }

    function menuItemEnabled(item) {
        var cell = this.context && this.context.cell;
        if (!cell) { return true; }

        if (item === 'remove') {
            if (!(cell.model && /^vendors\//.test(cell.model.key))) {
                // disable remove on non-vendor columns
                return false;
            }
        }
        return true;
    }

    function inviteToEdit(view) {
        var addCol = view.columns[view.columns.length - 1]; //last is addNew
        addCol.edited = true; // invite to edit
    }


    /////////////////////////////

    //TODO:
    //m.savingData = false; // show indicator

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
        var view = m.fullTableView;
        if (view.rows.length === 1 &&  view.columns.length === 3) {
            inviteToEdit(view);
        }
    }
}
