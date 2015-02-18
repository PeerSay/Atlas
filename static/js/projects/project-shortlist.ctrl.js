angular.module('PeerSay')
    .controller('ProjectShortlistCtrl', ProjectShortlistCtrl);

ProjectShortlistCtrl.$inject = ['$scope', 'Tiles', 'Table', 'Util'];
function ProjectShortlistCtrl($scope, Tiles, Table, _) {
    var m = this;

    m.tile = $scope.$parent.tile;
    m.projectId = $scope.$parent.m.projectId;
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
        .watching() //!
        .done();

    function getNormalViewConfig(model) {
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
                        total: ['col,col:weight', aggregateColumnScore]
                        /* TODO: Can be omitted because it works due to full view?,
                        max: ['footer', maxFootInRow]*/
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

    function getFullViewConfig() {
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

    function showFullView(control) {
        Tiles.toggleFullView(true, m.tile.uri, control);
    }

    function onFullView() {
        //nothing?
    }
}
