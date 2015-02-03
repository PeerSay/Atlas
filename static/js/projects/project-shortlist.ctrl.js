angular.module('peersay')
    .controller('ProjectShortlistCtrl', ProjectShortlistCtrl);

ProjectShortlistCtrl.$inject = ['$scope', '$timeout', 'Tiles', 'Table', 'Util'];
function ProjectShortlistCtrl($scope, $timeout, Tiles, Table, _) {
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

    m.normalTableView = Table.addView(m, 'sh-norm', getNormalViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: false})
        .done();

    m.fullTableView = Table.addView(m, 'sh-full', getFullViewConfig)
        //.debug() // opt
        .grouping()
        .sorting({active: true})
        .done();

    function getNormalViewConfig(model) {
        // Columns: Score1, [Score2, Score3] | {Products}
        var res = [
            {
                selector: 'vendors/.*?/score',
                limit: 3,
                cell: {
                    type: 'ordinary'
                }
            }
        ];

        //TODO - extra row: Total scores

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
        // Columns: Criteria, Score1, [Score2, Score3, ...]
        return [
            {
                selector: 'name',
                column: {
                    sortable: true
                },
                cell: {
                    type: 'static'
                },
                footer: { value: '', watch: false }
            },
            {
                selector: 'weight',
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'number'
                },
                footer: { value: 'Total:', watch: true }
            },
            {
                selector: 'vendors/.*?/score',
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'number'
                },
                footer: {value: '--', watch: true, aggregate: aggregateColumnScore}
            }
        ];

        //TODO - extra row: Total scores
    }

    function aggregateColumnScore(scores, weights) {
        var grade = 0, weightTot = 0;
        _.forEach(scores, function (score, i) {
            weightTot += weights[i];
            grade += score * weights[i];
        });
        grade = Math.round(grade / weightTot * 100); // ok?
        return grade;
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
        /*var cell = this.context && this.context.cell;
        if (!cell) { return true; }

        if (item === 'remove') {
            if (!(cell.model && /^vendors\//.test(cell.model.key))) {
                // disable remove on non-vendor columns
                return false;
            }
        }*/
        return true;
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
        /*var view = m.fullTableView;
        if (view.rows.length === 1 &&  view.columns.length === 3) {
            inviteToEdit(view);
        }*/
    }
}
