angular.module('PeerSay')
    .controller('ProjectShortlistEditCtrl', ProjectShortlistEditCtrl);

ProjectShortlistEditCtrl.$inject = ['$stateParams', 'Table', 'Util', 'Wizard'];
function ProjectShortlistEditCtrl($stateParams, Table, _, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[3];
    m.title = m.step.title;
    m.onClose = function () {
        Wizard.closeDialog(m.step);
    };
    m.goPrev = function () {
        Wizard.prev({from: m.step});
    };

    // Table views
    m.groupBy = Table.groupBy;

    m.tableView = Table.addView(m, 'sh-full', getViewConfig)
        //.debug()
        .grouping()
        .sorting({active: true})
        .watching() //!
        .done();

    function getViewConfig() {
        // Columns: Criteria, Weight, Score1, [Score2, Score3, ...]
        return [
            {
                selector: 'name',
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'multiline'
                },
                footer: { value: '' }
            },
            {
                selector: 'weight',
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'number',
                    maxNumber: 100,
                    computed: {
                        percent: ['col', computePercents]
                    }
                },
                footer: { value: 'Total:' }
            },
            {
                selector: 'vendors/.*?/score',
                cellModels: ['~input'], // for tooltip -- need to get input
                column: {
                    editable: true,
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'number',
                    maxNumber: 10,
                    computed: {
                        max: ['row', Table.aggr.rowIsMax]
                    }
                },
                footer: {
                    computed: {
                        total: ['col,col:weight', Table.aggr.columnTotalScore],
                        max: ['footer', Table.aggr.rowIsMax]
                    }
                }
            }
        ];
    }

    function computePercents(value, colCells) {
        var sum = colCells.reduce(function (prev, cur) {
            return prev + cur;
        }, 0);
        return sum ? Math.round(value / sum * 100) : 0;
    }

    /////////////////////////////

    //TODO:
    //m.savingData = false; // show indicator

}
