angular.module('PeerSay')
    .controller('ProjectProductsCtrl', ProjectProductsCtrl);

ProjectProductsCtrl.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'Table'];
function ProjectProductsCtrl($scope, $state, $stateParams, $timeout, Table) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.title = 'Project Products 2';
    m.onClose = onClose;
    m.goPrev = goPrev;
    m.goFirst = goFirst;
    // Table views
    m.groupBy = Table.groupBy;
    m.tableView = Table.addView(m, 'vi-full', getViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    $scope.$on('$destroy', function () {
        m.tableView.destroy();
    });


    function getViewConfig() {
        // Columns: Criteria, Prod1, [Prod2, Prod3, ...], {AddNew}
        return [
            {
                selector: 'name',
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'multiline'
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
                columnModel: { field: 'Add', value: ''}, // addNew
                column: {
                    editable: true,
                    placeholder: 'Add product...',
                    last: true,
                    'add-column': true
                },
                cell: {
                    type: 'static',
                    noMenu: true
                }
            }
        ];
    }

    //Menu
    m.menu = {
        id: 'vi-context-menu',
        context: null,
        view: m.tableView,
        setContext: function (context) {
            this.context = context;
        },
        enabled: menuItemEnabled,
        doAction: menuDoAction
    };
    m.tableView.menu = m.menu; // expose to Table directive

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
            if (!(cell.model && /^vendors/.test(cell.model.key))) {
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

    function onClose() {
        $state.go('^');
    }

    function goPrev() {
        $state.go('^.requirements');
    }

    function goFirst() {
        $state.go('^.essentials');
    }
}
