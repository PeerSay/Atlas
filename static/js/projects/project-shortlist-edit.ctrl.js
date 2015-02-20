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
                    type: 'static'
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
                    computed: {
                        percent: ['col', computePercents]
                    }
                },
                footer: { value: 'Total:' }
            },
            {
                selector: 'vendors/.*?/score',
                column: {
                    sortable: true
                },
                cell: {
                    editable: true,
                    type: 'number',
                    computed: {
                        max: ['row', maxInRow]
                    }
                },
                footer: {
                    computed: {
                        total: ['col,col:weight', aggregateColumnScore],
                        max: ['footer', maxInRow]
                    }
                }
            }
        ];
    }

    function aggregateColumnScore(prevVal, scores, weights) {
        var grade = 0, weightTot = 0;
        _.forEach(scores, function (score, i) {
            var weight = weights[i];
            weightTot += weight;
            grade += score * weight;
        });
        grade = weightTot ? Math.round(grade / weightTot * 100) : 0; // weighted average
        return grade;
    }

    function maxInRow(value, rowVals) {
        var max = 0;
        _.forEach(rowVals, function (val) {
            if (val > max) {
                max = val;
            }
        });
        //console.log('>>Max-in-row for %s->%s, res=', value, JSON.stringify(rowVals), (value === max));
        return (value === max);
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
