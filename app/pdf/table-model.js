var _ = require('lodash');

// TODO - unify with client code

function TableModel() {
    var T = {};
    T.model = {
        columns: [],
        rows: [],
        groups: []
    };
    T.build = build;

    var columnIdx = {};
    var groupIdx = {};

    function build(reqs) {
        addHeader('name', {value: 'Requirement'});
        addFooter('name', {value: 'Total:'});

        addHeader('mandatory', {value: 'Mandatory'});
        addFooter('mandatory', {value: ''});

        addHeader('weight', {value: 'Weight'});
        addFooter('weight', {value: '100%'});

        _.forEach(reqs, function (req, rowIdx) {
            addCell('name', rowIdx, {value: req.name});
            addCell('mandatory', rowIdx, {value: req.mandatory});
            addCell('weight', rowIdx, {value: req.weight});

            _.forEach(req.products, function (prod) {
                // Input
                var colInputKey = 'prod-input-' + prod.prodId;
                addHeader(colInputKey, {value: prod.name});
                addCell(colInputKey, rowIdx, {value: prod.input});
                addFooter(colInputKey, {value: ''});
                // Grade
                var colGradeKey = 'prod-grade-' + prod.prodId;
                addHeader(colGradeKey, {value: 'Grade'});
                addCell(colGradeKey, rowIdx, {value: prod.grade, type: 'grade'});
                addFooter(colGradeKey, {func: productGradeComputeFn(colGradeKey)});
            });

            addToGroup(req.topic, rowIdx);
        });
    }

    function getColumn(key) {
        var col = columnIdx[key];
        if (!col) {
            col = columnIdx[key] = {};
            T.model.columns.push(col);
        }
        return col;
    }

    function addHeader(key, data) {
        var col = getColumn(key);
        col.header = data;
    }

    function addFooter(key, data) {
        var col = getColumn(key);
        col.footer = data;
    }

    function addColumnCell(key, cell) {
        var col = getColumn(key);
        col.cells = col.cells || [];
        col.cells.push(cell);
    }

    function addCell(colKey, rowIdx, req, data) {
        var row = T.model.rows[rowIdx];
        if (!row) {
            row = {
                req: req,
                cells: []
            };
            T.model.rows.push(row);
        }

        var cell = data;
        row.cells.push(cell);
        addColumnCell(colKey, cell);
    }

    // Compute vals
    function productGradeComputeFn(colKey) {
        return function () {
            var grades = columnIdx[colKey].cells;
            var weights = columnIdx['weight'].cells;

            var total = weights.reduce(function (prev, current, i) {
                var weight = current.value;
                var grade = grades[i].value;
                return {
                    weight: prev.weight + weight,
                    grade: prev.grade + grade * weight
                };
            }, {weight: 0, grade: 0});

            var ave = total.weight ? total.grade / total.weight : 0; // weighted average
            if (ave) {
                ave = Math.round(ave * 10) / 10; // .1
            }
            return ave;
        }
    }

    // Groups
    function addToGroup(topic, rowIdx) {
        var key = topic || '(no name)';
        var group = groupIdx[key] = groupIdx[key] || Group();
        var row = T.model.rows[rowIdx];
        group.addRow(row);
    }

    function Group() {
        var G = {};
        G.addRow = addRow;
        G.weight = calcWeightPercents;
        G.grades = [];

        var rows = [];
        var groupColIdx = {};

        function addRow(row) {
            rows.push(row);
            addCols(row);
        }

        function addCols(row) {
            console.log('>>> cells', row.cells);

            var gradeCells = _.map(row.cells, function (cell) {

                console.log('>>> cell: ', row.cells);

                return cell.type === 'grade' ? cell : null;
            });

            _.forEach(gradeCells, function (cell, idx) {
                var colKey = 'group-grade-' + idx;
                addCol(colKey, {grade: cell.value});
            });
        }

        function addCol(key, data) {
            var col = getColumn(key);
            col.cells.push(data);
        }

        function getColumn(key) {
            var col = groupColIdx[key];
            if (!col) {
                col = groupColIdx[key] = {
                    cells: [],
                    func: calcGroupGrade
                };
                G.grades.push(col);
            }
            return col;
        }

        function calcWeightPercents() {
            var totalWeight = calcTotalWeight();
            if (!totalWeight) { return 0; }

            var groupWeight = calcGroupWeight();
            var weightPercents = Math.round(groupWeight / totalWeight * 100);
            return weightPercents;
        }

        function calcGroupWeight() {
            var groupWeight = rows.reduce(function (prev, cur) {
                return prev + cur.req.weight;
            }, 0);
            return groupWeight;
        }

        function calcGroupGrade() {
            var groupWeight = calcGroupWeight();
            if (!groupWeight) { return 0; }

            var totalGrade =  this.cells.reduce(function (prev, cur) {
                var weight = cur.req.weight;
                var grade = cur.grade.value;
                return prev + grade * weight;
            }, 0);

            var ave = Math.round(totalGrade / groupWeight * 10) / 10; // .1
            return ave;
        }

        function calcTotalWeight() {
            var weights = columnIdx['weight'].cells;
            return weights.reduce(function (prev, cur) {
                return prev + cur.value;
            }, 0);
        }

        return G;
    }

    return T;
}

module.exports = {
    TableModel: TableModel
};