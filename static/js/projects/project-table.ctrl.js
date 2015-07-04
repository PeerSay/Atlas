angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$stateParams', 'ngTableParams', 'Projects', 'jsonpatch', 'Util'];
function ProjectTableCtrl($scope, $stateParams, ngTableParams, Projects, jsonpatch,  _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.project = null;
    m.patchObserver = null;
    m.patchProject = patchProject;

    // Table model/view
    var table = Table(m);
    m.tableView = table.getView();
    m.getCsv = table.getCsv.bind(table);
    m.loadingMore = true;
    m.activate = activate;
    //Full screen
    m.fullscreen = {
        on: false,
        toggle: function () {
            this.on = !this.on;
        }
    };

    $scope.$on('$destroy', function () {
        jsonpatch.unobserve(m.project, m.patchObserver);
    });

    function activate() {
        return Projects.readProjectTable(m.projectId).then(function (res) {
            //console.log('>>', res.table);

            m.project = {table: res.table};
            m.patchObserver = jsonpatch.observe(m.project);

            m.loadingMore = false;
            return res.table;
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }


    // Table Class
    function Table(ctrl) {
        var T = {};
        T.getView = getView;
        T.model = {
            columns: [],
            rows: []
        };
        T.getCsv = Exporter(T.model).getCsv;

        var columnIdx = {};
        var view = {};
        // ngTable params
        var settings = {
            counts: [], // remove paging
            defaultSort: 'asc',
            getData: getData,
            groupBy: groupBy
        };
        var parameters = {
            count: 2 // must be at least one prop different from defaults!
        };

        // ngTable stuff
        function getView() {
            view.ctrl = ctrl;
            view.tableParams = new ngTableParams(parameters, settings);
            return view;
        }

        function groupBy(row) {
            return row.req.topic; // TODO - total group weight
        }

        // Model

        function getData($defer) {
            ctrl.activate().then(function (reqs) {
                buildModel(reqs);
                view.columns = T.model.columns;
                view.rows = T.model.rows;

                $defer.resolve(T.model.rows);
            });
        }

        function buildModel(reqs) {
            addHeader('name', {label: 'Requirement'});
            addFooter('name', {label: 'Total:', type: 'static'});

            addHeader('mandatory', {label: 'Mandatory', 'class': 'min'});
            addFooter('mandatory', {label: '', type: 'static'});

            addHeader('weight', {label: 'Weight', 'class': 'min'});
            addFooter('weight', {label: '100%', type: 'static'});

            _.forEach(reqs, function (req, rowIdx) {
                addCell('name', rowIdx, req, {
                    label: req.name,
                    type: 'static'
                });
                addCell('mandatory', rowIdx, req, {
                    label: req.mandatory ? 'fa-check' : '',
                    type: 'icon'
                });
                addCell('weight', rowIdx, req, {
                    model: CellModel(req, 'weight', {
                        tooltipFn: weightPercentComputeFn,
                        muteRowFn: muteOnZeroFn
                    }),
                    type: 'number',
                    max: 100
                });

                _.forEach(req.products, function (prod) {
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
                            muteProdFn: req.mandatory ? muteOnZeroFn : null
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
        }

        function addHeader(key, data) {
            var col = columnIdx[key];
            if (!col) {
                col = columnIdx[key] = {};
                T.model.columns.push(col);
            }
            col.header = data;
        }

        function addFooter(key, data) {
            var col = columnIdx[key];
            if (!col) {
                col = columnIdx[key] = {};
                T.model.columns.push(col);
            }
            col.footer = data;
        }

        function addColumnCell(key, cell) {
            var col = columnIdx[key];
            if (!col) {
                col = columnIdx[key] = {};
                T.model.columns.push(col);
            }
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
            M.max = (addon || {}).max;
            M.save = saveValue;
            M.toString = toString;

            if (addon && addon.tooltipFn) {
                M.tooltip = addon.tooltipFn(M);
            }
            if (addon && addon.muteRowFn) {
                M.muteRow = addon.muteRowFn(M);
            }
            if (addon && addon.muteProdFn) {
                M.muteProd = addon.muteProdFn(M);
            }

            var oldValue = m.value;

            function saveValue() {
                //console.log('>>Saving: ', M.value);

                if (!validate()) {
                    M.value = oldValue;
                    return false;
                }

                obj[path] = oldValue = M.value;
                m.patchProject();
                return true
            }

            function validate() {
                var invalid = (!M.value && M.value !== 0);
                return !invalid;
            }

            function toString() {
                var val = angular.isDefined(M.value) ? M.value : '';
                var addon =  M.tooltip ? ['/', M.tooltip()].join('') : '';
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
                    var weight = current.model.value;
                    var grade = grades[i].model.value;
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

        function weightPercentComputeFn(cellModel) {
            return function () {
                var value = cellModel.value;
                var weights = columnIdx['weight'].cells;

                var totalWeight = weights.reduce(function (prev, current) {
                    var weight = current.model.value;
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
                    var grade = current.grade;
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
            }
        }

        function muteOnZeroFn(model) {
            return function () {
                return (model.value === 0);
            };
        }

        return T;
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
            _.forEach(model.rows, function (row) {
                res += getRowStr(row.cells, function (cell) {
                    return (cell.type === 'static') ? cell.label : cell.model.toString();
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
            _.forEach(arr, function (it, j) {
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
                .replace(/"/g,'""'); // replace quotes with double quotes;
            if (res.search(/("|,|\n)/g) >= 0) {
                res = '"' + res + '"'; // quote if contains special chars
            }
            return res;
        }
        
        return E;
    }
}
