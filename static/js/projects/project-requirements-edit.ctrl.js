angular.module('PeerSay')
    .controller('ProjectRequirementsEditCtrl', ProjectRequirementsEditCtrl);

ProjectRequirementsEditCtrl.$inject = ['$scope', '$stateParams', '$timeout', 'Table', 'Wizard'];
function ProjectRequirementsEditCtrl($scope, $stateParams, $timeout, Table, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[1];
    m.title = m.step.title;
    m.onClose = function () {
        Wizard.closeDialog(m.step);
    };

    m.goPrev = function () {
        Wizard.prev({from: m.step});
    };
    m.goNext = function () {
        Wizard.next({from: m.step});
    };

    // Table views
    m.groupBy = Table.groupBy;
    m.tableView = Table.addView(m, 'ev-full', getViewConfig)
        //.debug()
        .grouping()
        .sorting({active: true})
        .done();

    $scope.$on('$destroy', function () {
        m.tableView.destroy();
    });


    function getViewConfig() {
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
            {
                selector: ['topic', 'priority'],
                column: {
                    sortable: true
                },
                cell: {
                    type: 'static'
                }
            },
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

        return spec;
    }

    //Menu
    m.menu = {
        id: 'er-context-menu',
        context: null,
        view: m.tableView,
        setContext: function (context) {
            this.context = context;
        },
        enabled: menuItemEnabled,
        doAction: menuDoAction
    };
    m.tableView.hasAddLink = true;
    m.tableView.menu = m.menu; // expose to Table directive

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

    function onFullView() {
        var rows = m.tableView.rows;
        if (rows.length === 1) {
            rows[0][0].justAdded = true; // TODO - fix
        }
    }
}
