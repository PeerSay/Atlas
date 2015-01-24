angular.module('peersay')
    .controller('ProjectVendorsCtrl', ProjectVendorsCtrl);

ProjectVendorsCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table', 'TableModel', 'Util'];
function ProjectVendorsCtrl($scope, $timeout, Tiles, Table, TableModel, _) {
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

    m.normalTableView = Table.addView(m, 'vi-norm', toNormViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'vi-full', toFullViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData() {
        var groupBy = m.groupBy.get();
        var vendors = TableModel.selectColumns([{ vendor: true }], 3);
        var group = TableModel.selectColumns([{ field: groupBy }]);
        var data = {
            columns: [],
            rows: []
        };

        // Columns: Prod1, [Prod2, Prod3] | Products?
        _.forEach(vendors.columns, function (col) {
            data.columns.push({
                model: col,
                visible: true,
                editable: false,
                sortable: false
            })
        });
        // add grouping column
        _.forEach(group.columns, function (col) {
            data.columns.push({
                model: col,
                visible: false,
                editable: false,
                sortable: false
            })
        });
        // Artificial column to show empty table
        data.columns.push({
            model: { value: 'Products' },
            visible: !vendors.columns.length,
            editable: false,
            sortable: false
        });

        // Rows
        _.forEach(vendors.rows, function (row, i) {
            var fullRow = [].concat(row, group.rows[i]);
            var resRow = [];
            _.forEach(fullRow, function (cell, j) {
                resRow.push({
                    model: cell,
                    visible: data.columns[j].visible,
                    editable: false,
                    type: 'ordinary'
                });
            });
            data.rows.push(resRow);
        });

        return data;
    }

    function toFullViewData() {
        var groupBy = m.groupBy.get();
        var model = TableModel.selectColumns([{ field: 'name' }, { field: groupBy }, { vendor: true }]);
        var data = {
            columns: [],
            rows: []
        };

        // Columns: Criteria, {Group}(hidden), Prod1, [Prod2, Prod3], {AddNew}
        _.forEach(model.columns, function (col) {
            data.columns.push({
                model: col,
                visible: (col.field !== groupBy),
                editable: col.vendor,
                sortable: true
            })
        });
        // last is empty
        data.columns.push({
            model: { id: 'new', field: '...', value: ''},
            visible: true,
            editable: true,
            sortable: false,
            last: true,
            placeholder: 'Add product...'
        });

        //Rows
        _.forEach(model.rows, function (row) {
            var resRow = [];
            _.forEach(row, function (cell, i) {
                resRow.push({
                    model: cell,
                    visible: data.columns[i].visible,
                    editable: cell.column.vendor,
                    type: !cell.column.vendor ? 'static' : 'multiline'
                });
            });
            // last row -- empty
            resRow.push({
                model: {},
                visible: true,
                editable: false,
                type: 'static'
            });
            data.rows.push(resRow);
        });

        return data;
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
            else {
                inviteToEdit(view);
            }
        }, 0, false);
    }

    function menuItemEnabled(item) {
        var cell = this.context && this.context.cell;
        if (!cell) { return true; }

        if (item === 'remove') {
            if (!(cell.model.column && cell.model.column.vendor)) {
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
