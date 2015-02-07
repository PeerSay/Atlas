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
                        max: ['row~score', maxInRow]
                    }
                },
                footer: {
                    computed: {
                        total: ['col,col:weight', aggregateColumnScore]/*,
                        max: ['footer', maxFootInRow]*/
                    }
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
                        max: ['row~score', maxInRow]
                    }
                },
                footer: {
                    computed: {
                        total: ['col,col:weight', aggregateColumnScore]/*,
                        max: ['footer', maxFootInRow]*/
                    }
                }
            }
        ];
    }

    function aggregateColumnScore(prevVal, scores, weights) {
        var grade = 0, weightTot = 0;
        _.forEach(scores, function (score, i) {
            var weight = weights[i].value;
            weightTot += weight;
            grade += score.value * weight;
        });
        grade = weightTot ? Math.round(grade / weightTot * 100) : 0; // weighted average
        return grade;
    }

    function maxInRow(value, rowCells) {
        var max = 0;
        _.forEach(rowCells, function (cell) {
            if (cell.value > max) {
                max = cell.value;
            }
        });
        //console.log('>>Max-in-row for %s->%s, res=', value, JSON.stringify(rowCells), (value === max));
        return (value === max);
    }

    // TODO
    function maxFootInRow(value, rowCells) {
        var max = 0;
        _.forEach(rowCells, function (cell) {
            if (cell.value > max) {
                max = cell.value;
            }
        });
        //console.log('>>Max-in-row for %s->%s, res=', value, JSON.stringify(rowCells), (value === max));
        return (value === max);
    }

    function computePercents(value, colCells) {
        var sum = colCells.reduce(function (prev, cur) {
            return prev + cur.value;
        }, 0);
        return sum ? Math.round(value / sum * 100) : 0;
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
