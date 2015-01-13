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

    m.normalTableView = Table.addView(m, 'vi-norm', toNormViewData)
        //.debug() // opt
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'vi-full', toFullViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData(model) {
        var data = {
            columns: [],
            rows: []
        };
        // Columns: Criteria(hidden), Prod1, [Prod2, Prod3] | Products
        // Criteria is required for sorting (hidden)
        data.columns.push({
            title: 'Criteria',
            field: 'name',
            visible: false
        });
        // Artificial column to show empty table
        data.columns.push({
            title: 'Products',
            field: '',
            visible: !model.vendors.length
        });
        angular.forEach(model.vendors, function (vendor, i) {
            data.columns.push({
                title: vendor.title,
                field: vendor.title,
                visible: i < 3, // hide all but first 3; TODO - remove from arr?
                isVendor: true,
                cellType: 'ordinary'
            });
        });
        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                var cell = row[col.field] = {
                    type: col.cellType
                };
                if (col.isVendor) {
                    cell.value = (crit.vendorsIndex[col.field] || {}).value;
                } else {
                    cell.value = crit[col.field];
                }
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
        // Columns: Ctireria, Prod1, [Prod2, Prod3]
        data.columns.push({
            title: 'Criteria',
            field: 'name',
            visible: true,
            sortable: true,
            cellType: 'static'
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
                sortable: true,
                cellType: 'text',
                edit: {
                    show: false,
                    value: vendor.title
                }
            });
        });
        // Last column is Add New
        data.columns.push({
            title: '...',
            field: '--',
            visible: true,
            addNew: true,
            cellType: 'static',
            edit: {
                show: false,
                value: ''
            }
        });

        // Rows
        angular.forEach(model.criteria, function (crit, idx) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                if (col.addNew) {
                    row[col.field] = {
                        type: col.cellType,
                        value: ''
                    };
                }
                else if (col.edit) {
                    row[col.field] = {
                        type: col.cellType,
                        value: (crit.vendorsIndex[col.field] || {}).value,
                        inputId: col.field + idx,
                        criteria: crit, // for save
                        field: col.field,
                        isVendor: true
                    };
                }
                else if (col.visible) {
                    row[col.field] = {
                        type: col.cellType,
                        value: crit[col.field],
                        noMenu: true
                    };
                } else {
                    row[col.field] = {
                        value: crit[col.field]
                    };
                }
            });
            data.rows.push(row);
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
            view.removeColumn(cell);
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
