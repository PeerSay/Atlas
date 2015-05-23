angular.module('PeerSay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'Table'];
function ProjectRequirementsCtrl($scope, $state, $stateParams, $timeout, Table) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.title = 'Project Requirements 2';
    m.onClose = onClose;
    m.goNext = goNext;
    m.goPrev = goPrev;
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

    function onClose() {
        $state.go('^');
    }

    function goNext() {
        $state.go('^.products');
    }

    function goPrev() {
        $state.go('^.essentials');
    }
}
