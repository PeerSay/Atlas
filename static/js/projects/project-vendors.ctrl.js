angular.module('peersay')
    .controller('ProjectVendorsCtrl', ProjectVendorsCtrl);

ProjectVendorsCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table', 'TableModel'];
function ProjectVendorsCtrl($scope, $timeout, Tiles, Table, TableModel) {
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
        angular.forEach(vendors.columns, function (col) {
            data.columns.push({
                model: col,
                visible: true,
                editable: false,
                sortable: false
            })
        });
        // add grouping column
        angular.forEach(group.columns, function (col) {
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
        angular.forEach(vendors.rows, function (row, i) {
            var fullRow = [].concat(row, group.rows[i]);
            var resRow = [];
            angular.forEach(fullRow, function (cell, j) {
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
        angular.forEach(model.columns, function (col) {
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
        angular.forEach(model.rows, function (row) {
            var resRow = [];
            angular.forEach(row, function (cell, i) {
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
        addProduct: menuAddProduct,
        removeProduct: menuRemoveProduct
    };
    m.fullTableView.menu = m.menu; // expose to Table directive

    function menuAddProduct() {
        var addCol = $.map(this.view.columns, function (col) {
            return col.addNew ? col : null
        })[0];
        if (addCol) {
            addCol.edit.show = true; // invite to edit
        }
    }

    function menuRemoveProduct() {
        var view = this.view;
        var cell = this.context.cell;

        // delay to allow context-menu event handler to close menu,
        // otherwise it remains open
        $timeout(function () {
            view.removeColumn(cell.model);
        }, 0, false);
    }

    /////////////////////////////

    //TODO:
    //m.savingData = false; // show indicator

    // Handle popover
    //m.popoverOn = null;

    // Editing cells
    //m.criteriaKeyPressed = criteriaKeyPressed;

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
        //TODO - invite to edit new Product if table is empty
    }
}
