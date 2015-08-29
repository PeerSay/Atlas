// Can be used on both client and server, thus declared as either Angular
// or CommonJS module, depending on environment

(function (global, factory) {
    if (global.angular) {
        angular.module('PeerSay')
            .factory('TableModel', factory);
    }
    else if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    }
})(this, TableModel);


function TableModel() {
    var T = {};
    T.model = {
        columns: [],
        rows: []
    };
    T.groups = Groups();
    T.buildModel = buildModel;
    T.getCsv = Exporter(T.model).getCsv;

    var columnIdx = {};

    // Build
    //
    function reset() {
        T.model.columns = [];
        T.model.rows = [];
        T.groups = Groups();
        columnIdx = {};
    }

    function buildModel(reqs) {
        reset();

        addHeader('name', {label: 'Requirement'});
        addFooter('name', {label: 'Total:', type: 'static'});

        addHeader('mandatory', {label: 'Mandatory', 'class': 'min'});
        addFooter('mandatory', {label: '', type: 'static'});

        addHeader('weight', {label: 'Weight', 'class': 'min'});
        addFooter('weight', {label: '100%', type: 'static', 'class': 'center'});

        reqs.forEach(function (req, rowIdx) {
            addCell('name', rowIdx, req, {
                label: req.name,
                type: 'static'
            });
            addCell('mandatory', rowIdx, req, {
                label: req.mandatory ? 'fa-check' : '',
                type: 'icon',
                'class': 'center static'
            });
            addCell('weight', rowIdx, req, {
                model: CellModel(req, 'weight', {
                    tooltipFn: weightPercentComputeFn,
                    muteRowFn: muteOnZeroFn
                }),
                type: 'number',
                max: 100
            });

            req.products.forEach(function (prod) {
                // Input
                var colInputKey = 'prod-input-' + prod.prodId;
                addHeader(colInputKey, {label: prod.name, 'class': 'text-input'});
                addCell(colInputKey, rowIdx, req, {
                    model: CellModel(prod, 'input'),
                    type: 'text'
                });
                addFooter(colInputKey, {label: '', type: 'static'});

                // Grade
                var colGradeKey = 'prod-grade-' + prod.prodId;
                addHeader(colGradeKey, {label: 'Grade', 'class': 'grade'});
                addCell(colGradeKey, rowIdx, req, {
                    model: CellModel(prod, 'grade', {
                        max: gradeMaxInRowFn(req, prod),
                        muteProdFn: muteProdFnFn(req),
                        tooltipFn: mandatoryTooltipFnFn(req)
                    }),
                    type: 'number', max: 10,
                    'class': 'grade'
                });
                addFooter(colGradeKey, {
                    model: {
                        value: productGradeComputeFn(colGradeKey),
                        max: totalGradeMaxFn(colGradeKey)
                    },
                    type: 'func',
                    'class': 'grade'
                });
            });
        });

        return T.model;
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

    // Binding/Models
    //
    function CellModel(obj, path, addon) {
        var M = {};
        M.value = obj[path]; // binded!
        M.save = saveValue;
        M.toString = toString;
        // Addons
        M.max = (addon || {}).max;
        if (addon && addon.tooltipFn) {
            M.tooltip = addon.tooltipFn(M);
        }
        if (addon && addon.muteRowFn) {
            M.muteRow = addon.muteRowFn(M);
        }
        if (addon && addon.muteProdFn) {
            M.muteProd = addon.muteProdFn(M);
        }

        var oldValue = M.value;

        function saveValue() {
            //console.log('>>Saving: ', M.value);

            if (!validate()) {
                M.value = oldValue;
                return false;
            }

            obj[path] = oldValue = M.value;
            return true;
        }

        function validate() {
            if (typeof M.value === 'undefined') {
                // angular undefs value if it is not valid according to model-options
                return false;
            }
            if (typeof M.value === 'number') {
                M.value = parseInt(M.value, 10); // remove fraction part
                return true;
            }
            return true;
        }

        function toString() {
            var val = (typeof M.value !== 'undefined') ? M.value : '';
            var tooltip = M.tooltip && M.tooltip();
            var addon = tooltip ? ['/', tooltip].join('') : '';
            return val + addon;
        }

        return M;
    }

    // Computed vals
    //
    function productGradeComputeFn(colKey) {
        return function () {
            //console.log('>>Reduced!');

            var grades = columnIdx[colKey].cells;
            var weights = columnIdx['weight'].cells;

            var total = weights.reduce(function (prev, current, i) {
                var weight = current.model.value || 0;
                var grade = grades[i].model.value || 0;
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
        };
    }

    function weightPercentComputeFn(cellModel) {
        return function () {
            var value = cellModel.value || 0;
            var weights = columnIdx['weight'].cells;

            var totalWeight = weights.reduce(function (prev, current) {
                var weight = current.model.value || 0;
                return prev + weight;
            }, 0);

            var percent = totalWeight ? Math.round(value / totalWeight * 100) : 0;
            return percent + '%';
        };
    }

    function gradeMaxInRowFn(req, prod) {
        return function () {
            var value = prod.grade;
            if (!value) { return false;}

            var max = req.products.reduce(function (prev, current) {
                var grade = current.grade || 0;
                return Math.max(prev, grade);
            }, 0);

            return (value === max);
        };
    }

    function totalGradeMaxFn(colKey) {
        return function () {
            var value = columnIdx[colKey].footer.model.value();
            if (!value) { return false; }

            var max = T.model.columns.reduce(function (prev, current) {
                var model = current.footer.model;
                var total = model ? model.value() : 0;
                return Math.max(prev, total);
            }, 0);

            return (value === max);
        };
    }

    function muteOnZeroFn(model) {
        return function () {
            return (model.value === 0);
        };
    }

    function muteProdFnFn(req) {
        return function (model) {
            return function () {
                return req.mandatory && (model.value === 0);
            };
        };
    }


    function mandatoryTooltipFnFn(req) {
        return function (model) {
            return function () {
                var unsupported = req.mandatory && (model.value === 0);
                return unsupported ? 'Unsupported mandatory requirement' : '';
            };
        };
    }

    // Groups
    //
    function Groups() {
        var G = {};
        G.add = add;
        G.get = get;
        G.list = [];
        var cache = {};

        function get(key) {
            return cache[key];
        }

        function add(row, expandedState) {
            var key = row.req.topic || '(no name)';
            var group = cache[key];
            if (!group) {
                group = cache[key] = Group(key, expandedState);
                G.list.push(group);
            }
            group.addRow(row);

            return key;
        }

        function Group(name, expandedState) {
            var G = {};
            G.name = name;
            G.addRow = addRow;
            G.weight = calcWeightPercents;
            G.grades = [];
            G.rows = []; // used by presentations
            if (expandedState) {
                // This is StorageRecord instance. Cannot instantiate it here because
                // this module must not have angular dependency injection as it's used by server too.
                G.expanded = expandedState;
            }

            var groupColIdx = {};

            function addRow(row) {
                G.rows.push(row);
                addCols(row);
            }

            function addCols(row) {
                var gradeCells = row.cells.filter(function (cell) {
                    return cell.class === 'grade';
                });

                gradeCells.forEach(function (cell, idx) {
                    var colKey = 'group-grade-' + idx;
                    addCol(colKey, {req: row.req, grade: cell.model});
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
                        grade: function () {
                            var groupWeight = calcGroupWeight();
                            if (!groupWeight) { return 0; }

                            var totalGrade = this.cells.reduce(function (prev, cur) {
                                var weight = cur.req.weight;
                                var grade = cur.grade.value;
                                return prev + grade * weight;
                            }, 0);

                            var ave = Math.round(totalGrade / groupWeight * 10) / 10; // .1
                            return ave;
                        }
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
                var groupWeight = G.rows.reduce(function (prev, cur) {
                    return prev + cur.req.weight;
                }, 0);
                return groupWeight;
            }

            function calcTotalWeight() {
                var weights = columnIdx['weight'].cells;
                return weights.reduce(function (prev, cur) {
                    return prev + cur.model.value;
                }, 0);
            }

            return G;
        }

        return G;
    }

    // Export
    //
    function Exporter(model) {
        var E = {};
        E.getCsv = getCsv;

        function getCsv() {
            // Header
            var res = getRowStr(model.columns, function (col) {
                return col.header.label;
            });
            //console.log('>>> CSV Titles: ', res);

            // Rows
            model.rows.forEach(function (row) {
                res += getRowStr(row.cells, function (cell) {
                    return (cell.type === 'static') ? cell.label :
                        (cell.type === 'icon') ? !!cell.label : cell.model.toString();
                });
            });
            //console.log('>>> CSV Rows: ', res);

            // Footer
            res += getRowStr(model.columns, function (col) {
                var cell = col.footer;
                return (cell.type === 'static') ? cell.label : cell.model.value();
            });
            //console.log('>>> CSV: ', res);
            return res;
        }

        function getRowStr(arr, valFn) {
            var res = '';
            arr.forEach(function (it, j) {
                var val = valFn(it);
                var txt = stringify(val);
                if (j > 0) {
                    res += ',';
                }
                res += txt;
            });
            return (res += '\n');
        }

        function stringify(val) {
            var str = (val === null) ? '' : val.toString();
            var res = str
                .replace(/^\s*/, '').replace(/\s*$/, '') // trim spaces
                .replace(/"/g, '""'); // replace quotes with double quotes;
            if (res.search(/("|,|\n)/g) >= 0) {
                res = '"' + res + '"'; // quote if contains special chars
            }
            return res;
        }

        return E;
    }

    return T;
}