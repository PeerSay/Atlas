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

    //activate();

    function activate() {
        return Projects.readProjectTable(m.projectId).then(function (res) {
            console.log('>>', res);

            m.project = {requirements: res};
            m.patchObserver = jsonpatch.observe(m.project);

            return res;
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
            addHeader({col: 'name', value: 'Requirement'});
            addFooter({col: 'name', value: 'Total:', type: 'label'});
            addHeader({col: 'weight', value: 'Weight'});
            addFooter({col: 'weight', value: '100%', type: 'label'}); // observe

            _.forEach(reqs, function (req, rowIdx) {
                addCell(rowIdx, req, { col: 'name', value: req.name, type: 'label' });
                addCell(rowIdx, req, { col: 'weight', model: CellModel(req, 'weight', 'number'), type: 'number', max: 100 });

                _.forEach(req.products, function (prod) {
                    // Input
                    var colInputKey = 'prod-input-' + prod.id;
                    addHeader({col: colInputKey, value: prod.name});
                    addCell(rowIdx, req, { col: colInputKey, model: CellModel(prod, 'input', 'text'), type: 'text' });
                    addFooter({col: colInputKey, value: '', type: 'label'});

                    // Grade
                    var colGradeKey = 'prod-grade-' + prod.id;
                    addHeader({col: colGradeKey, value: 'Grade'});
                    addCell(rowIdx, req, { col: colGradeKey, model: CellModel(prod, 'grade', 'number'), type: 'number', max: 10 });
                    addFooter({col: colGradeKey, value: productGradeComputeFn(colGradeKey), type: 'func'});
                });
            });
        }

        function addHeader(data) {
            var col = columnIdx[data.col];
            if (!col) {
                col = columnIdx[data.col] = {};
                T.model.columns.push(col);
            }
            col.header = { value: data.value };
        }

        function addFooter(data) {
            var col = columnIdx[data.col];
            if (!col) {
                col = columnIdx[data.col] = {};
                T.model.columns.push(col);
            }
            col.footer = {
                value: data.value,
                type: data.type
            };
        }

        function addColumnCell(colKey, cell) {
            var col = columnIdx[colKey];
            if (!col) {
                col = columnIdx[colKey] = {};
                T.model.columns.push(col);
            }
            col.cells = col.cells || [];
            col.cells.push(cell);
        }

        function addCell(rowIdx, req, data) {
            var row = T.model.rows[rowIdx];
            if (!row) {
                row = {
                    req: req,
                    cells: []
                };
                T.model.rows.push(row);
            }
            var cell = {
                type: data.type,
                value: data.value,
                model: data.model,
                max: data.max // XXX - to type
            };

            row.cells.push(cell);
            addColumnCell(data.col, cell);
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


        // Binding/Types
        //
        function CellModel(obj, path /*,type*/) {
            var M = {};
            M.value = obj[path]; // binded!
            M.save = save;
            M.validate = validate;

            var oldValue = m.value;

            function save() {
                console.log('>>Saving: ', M.value);

                if (!validate()) {
                    m.value = oldValue; // XXX- fix!
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


        return T;
    }
}
