angular.module('PeerSay')
    .controller('ProjectShortlistCtrl', ProjectShortlistCtrl);

ProjectShortlistCtrl.$inject = ['$stateParams', 'Table', 'Util', 'Wizard'];
function ProjectShortlistCtrl($stateParams, Table, _, Wizard) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.step = Wizard.steps[3];
    m.title = m.step.title;

    // Table views - XXX
    m.groupBy = Table.groupBy;

    m.tableView = Table.addView(m, 'sh-norm', getViewConfig)
        //.debug()
        .grouping()
        .sorting({active: false})
        .done();

    function getViewConfig(model) {
        // Columns: Score1, [Score2, Score3] | {Products}
        var res = [
            {
                selector: 'vendors/.*?/score',
                limit: 3,
                cell: {
                    type: 'number-static',
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

        var vendors = model.vendors;
        if (!vendors.length) {
            // show at least one column if no vendors added yet
            res.push({
                selector: null,
                columnModel: { field: 'Products', value: 'Products'},
                cellModels: ['name'] // first cell is used for grouping and must have criteria
            });
        }
         return res;
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
}
