angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$stateParams', 'ngTableParams', 'Projects', 'jsonpatch', 'Util'];
function ProjectTableCtrl($scope, $stateParams, ngTableParams, Projects, jsonpatch,  _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.project = null;
    m.patchObserver = null;
    m.patchProject = patchProject;

    // Table view
    m.activate = activate;
    m.tableView = Table(m).getView();
    m.loadingMore = true;

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
            addFooter('name', {label: 'Total:', type: 'label'});

            addHeader('weight', {label: 'Weight'});
            addFooter('weight', {label: '100%', type: 'label'});

            _.forEach(reqs, function (req, rowIdx) {
                addCell('name', rowIdx, req, {
                    label: req.name,
                    type: 'label'
                });
                addCell('weight', rowIdx, req, {
                    model: CellModel(req, 'weight', {
                        tooltip: weightPercentComputeFn(req)
                    }),
                    type: 'number',
                    max: 100
                });

                _.forEach(req.products, function (prod) {
                    // Input
                    var colInputKey = 'prod-input-' + prod.prodId;
                    addHeader(colInputKey, {label: prod.name});
                    addCell(colInputKey, rowIdx, req, {
                        model: CellModel(prod, 'input'),
                        type: 'text'
                    });
                    addFooter(colInputKey, {label: '', type: 'label'});

                    // Grade
                    var colGradeKey = 'prod-grade-' + prod.prodId;
                    addHeader(colGradeKey, {label: 'Grade'});
                    addCell(colGradeKey, rowIdx, req, {
                        model: CellModel(prod, 'grade', {
                            max: gradeMaxInRowFn(req, prod)
                        }),
                        type: 'number', max: 10
                    });
                    addFooter(colGradeKey, {
                        model: {
                            value: productGradeComputeFn(colGradeKey),
                            max: totalGradeMaxFn(colGradeKey)
                        },
                        type: 'func'});
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
            M.tooltip = (addon || {}).tooltip;
            M.max = (addon || {}).max;
            M.save = saveValue;

            var oldValue = m.value;

            function saveValue() {
                console.log('>>Saving: ', M.value);

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

        function weightPercentComputeFn(req) {
            return function () {
                var value = req.weight;
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

        return T;
    }
}
