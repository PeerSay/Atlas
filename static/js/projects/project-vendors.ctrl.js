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
    m.normalTableView = Table.addView(m.projectId, 'vi-norm', toNormViewData)
        //.debug() // opt
        .grouping() // TODO - should be disabled
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m.projectId, 'vi-full', toFullViewData)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function toNormViewData(model) {
        var data = {
            columns: [],
            rows: []
        };
        // Columns: Criteria(hidden), Prod1, [Prod2, Prod3]
        // Criteria is required for sorting (hidden)
        data.columns.push({
            title: '--',
            field: 'name',
            visible: false
        });
        angular.forEach(model.vendors, function (vendor, i) {
            data.columns.push({
                title: vendor.title,
                field: vendor.title,
                visible: i < 3, // hide all but first 3; TODO - remove from arr?
                isVendor: true
            });
        });
        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                if (col.isVendor) {
                    row[col.field] = {
                        value: (crit.vendorsIndex[col.field] || {}).value
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
            sortable: true
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
            edit: {
                show: false,
                value: ''
            }
        });

        // Rows
        angular.forEach(model.criteria, function (crit) {
            var row = {};
            angular.forEach(data.columns, function (col) {
                if (col.addNew) {
                    row[col.field] = {
                        type: 'static',
                        value: ''
                    };
                }
                else if (col.edit) {
                    row[col.field] = {
                        criteria: crit, // for save
                        field: col.field,
                        type: 'number',
                        value: (crit.vendorsIndex[col.field] || {}).value
                    };
                }
                else if (col.visible) {
                    row[col.field] = {
                        type: 'static',
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

    // Grouping
    m.groupBy = Table.groupBy;

    //Menu
    m.menu = {
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
