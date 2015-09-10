angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'TableModel', 'StorageRecord', 'Util', 'ProjectPatcherMixin'];
function ProjectTableCtrl($scope, $stateParams, Projects, TableModel, StorageRecord, _, ProjectPatcherMixin) {
    var m = ProjectPatcherMixin(this, $scope);

    m.projectId = $stateParams.projectId;
    m.project = null;
    m.loading = true;
    // Table model/view
    m.view = null;
    m.topicWeights = [];
    m.getCsv = function () {
        return Exporter().getCsv(m.view);
    };


    activate();

    function activate() {
        return Projects.readProject(m.projectId)
            .then(function (res) {
                m.project = res;
                m.observe({table: res.table, topicWeights: res.topicWeights});

                m.topicWeights = res.topicWeights.reduce(function (acc, it) {
                    return [].concat(acc, {id: it._id, weight: it.weight});
                }, []);
                watch(m.topicWeights);

                m.view = getView(res);
                return res;
            }).finally(function () {
                m.loading = false;
            });
    }

    function watch(weights) {
        var debouncedPatch = _.debounce(function (newWeights) {
            _.forEach(newWeights, function (it, i) {
                m.project.topicWeights[i].weight = _.round(it.weight, 2);
            });
            m.patchProject();
        }, 1000);

        $scope.$watch(function () {
            return weights;
        }, function (newVal, oldVal) {
            if (newVal !== oldVal) {
                debouncedPatch(newVal);
            }
        }, true);
    }

    function getView(project) {
        var view = {};
        var model = TableModel.build(function (T) {
            T.header()
                .push('name', {label: 'Requirement'})
                .push('mandatory', {label: 'Mandatory', 'class': 'min'})
                .push('weight', {label: 'Weight', 'class': 'min'});

            T.footer()
                .push('name', {label: 'Total:', type: 'static'})
                .push('mandatory', {label: '', type: 'static'})
                .push('weight', {label: '100%', type: 'static', 'class': 'center'});

            var rowIdx = 0;
            project.table.forEach(function (req, i) {
                if (!req.selected) { return; }
                rowIdx++;

                // Predefine ranges
                var rowRange = T.rows(i, {topic: req.topic});
                var rowMaxRange = T.range('row-max-' + i)
                    .aggregate({
                        max: T._max()
                    });
                var expandedState = StorageRecord.boolean(getExpandedGroupKey(req.topic));
                var groupsRange = T.range('groups', {multi: true});
                var groupRange = groupsRange(req.topic, {expanded: expandedState});
                var rowWeightRange = T.range('req-weights', {multi: true})(req.topic)
                    .aggregate({
                        total: T._sum(),
                        weight: reqWeightFn()
                    });


                groupRange
                    .push('name', {label: req.topic});
                //<- no mandatory col
                //.push('weight', {model: {}}); // <- TODO

                rowRange
                    .push('name', {label: req.name, type: 'static'})
                    .push('mandatory', {
                        label: req.mandatory ? 'fa-check' : '',
                        type: 'icon',
                        'class': 'center static'
                    });

                // Req weight
                var weightModel = CellModel(req, 'weight');
                rowWeightRange.push('', weightModel);
                rowRange
                    .push('weight', {
                        model: weightModel,
                        type: 'number', max: 100,
                        tooltip: reqWeightPercentFn(rowWeightRange, weightModel),
                        muteRow: muteRowFn(weightModel)
                    });

                req.products.forEach(function (prod, j) {
                    if (!prod.selected) { return; }

                    var prodInputKey = 'prod-input-' + j;
                    var prodGradeKey = 'prod-grade-' + j;

                    T.header()
                        .push(prodInputKey, {label: prod.name, 'class': 'text-input'})
                        .push(prodGradeKey, {label: 'Grade', 'class': 'grade'});

                    // Product input
                    rowRange
                        .push(prodInputKey, {
                            model: CellModel(prod, 'input'),
                            type: 'text'
                        });

                    // Product grade
                    var prodGradeModel = CellModel(prod, 'grade');
                    rowMaxRange.push('', prodGradeModel);
                    rowRange
                        .push(prodGradeKey, {
                            model: prodGradeModel,
                            type: 'number', max: 10,
                            'class': 'grade',
                            maxInRow: maxInRowFn(rowMaxRange, prodGradeModel),
                            muteProd: muteProdFn(req, prodGradeModel),
                            tooltip: mandatoryTooltipFn(req, prodGradeModel)
                        });

                    // Group grade
                    var prodsGradesInGroupRange = T.range('prod-group-grades-' + j, {multi: true})(req.topic)
                        .push('', prodGradeModel);
                    groupRange
                        .push(prodGradeKey, {
                            value: groupGradeFn(rowWeightRange, prodsGradesInGroupRange)
                        });

                    // Footer - totals
                    var maxTotalsRange = T.range('total-max').aggregate({
                        max: T._max(function (obj) {
                            return obj.value(); // default (T._val) assumes .value is not func
                        })
                    });
                    if (rowIdx === 1) {
                        // during first run only!
                        maxTotalsRange.push(prodGradeKey, {
                            value: totalGradeFn(groupsRange, m.project.topicWeights, prodGradeKey)
                        });
                    }

                    T.footer()
                        .push(prodInputKey, {label: '', type: 'static'})
                        .push(prodGradeKey, {
                            value: totalGradeGetFn(maxTotalsRange, prodGradeKey),
                            maxTotal: maxTotalFn(maxTotalsRange, prodGradeKey),
                            type: 'func',
                            'class': 'grade'
                        });

                });
            });
        });

        view.empty = !project.table.length;
        view.header = model.header().list;
        view.footer = model.footer().list;
        view.groups = model.groups && model.groups().list;
        view.rows = model.rows && model.rows().list;
        view.filerGroupRowsFn = function (topic) { // TODO - move to model as filter()?
            return function (row) {
                return (row().topic === topic);
            }
        };
        view.topicWeights = m.topicWeights;

        // Compute funcs
        //
        function maxInRowFn(range, cellModel) {
            return function () {
                var val = cellModel.value;
                var max = range.max(); // aggregated
                return (max === val);
            };
        }

        function reqWeightFn() {
            return function (range) {
                return function (val) {
                    var total = range.total(); // aggregated
                    return total ? val / total : 0;
                };
            };
        }

        function reqWeightPercentFn(range, cellModel) {
            return function () {
                var val = cellModel.value;
                var weight = range.weight(val); // aggregated
                var percent = Math.round(weight * 100) + '%';
                return percent;
            };
        }

        function groupGradeFn(rowWeightRange, prodsGradesInGroupRange) {
            return function () {
                var anyInit = false;
                var groupGrade = prodsGradesInGroupRange.list.reduce(function (acc, item, i) {
                    var val = item().value;
                    if (val !== null) {
                        anyInit = true;
                    }

                    var grade = val || 0; // null if grade is not init
                    var weightModel = rowWeightRange.access(i)();
                    var weight = rowWeightRange.weight(weightModel.value); // aggregated
                    return acc + grade * weight;
                }, 0);

                return anyInit ? _.round(groupGrade, 1) : '?';
            };
        }

        function totalGradeFn(groupsRange, topicWeights, prodKey) {
            return function () {
                var totalGrade = topicWeights.reduce(function (acc, cur) {
                    var weight = cur.weight;
                    var grade = groupsRange(cur.topic).access(prodKey)().value();
                    return acc + grade * weight;
                }, 0);
                return _.round(totalGrade, 1);
            };
        }

        function totalGradeGetFn(maxTotalsRange, prodKey) {
            return function () {
                var val = maxTotalsRange.access(prodKey)().value();
                // val=NaN when there are groups with grade === '?'
                return !isNaN(val) ? val: '?';
            };
        }

        function maxTotalFn(maxTotalsRange, prodKey) {
            return function () {
                var max = maxTotalsRange.max();
                var val = maxTotalsRange.access(prodKey)().value();
                return (max === val);
            };
        }

        function muteRowFn(model) {
            return function () {
                return (model.value === 0);
            };
        }

        function muteProdFn(req, model) {
            return function () {
                return req.mandatory && (model.value === 0);
            };
        }

        function mandatoryTooltipFn(req, model) {
            return function () {
                var unsupported = req.mandatory && (model.value === 0);
                return unsupported ? 'Unsupported mandatory requirement' : '';
            };
        }

        function getExpandedGroupKey(topic) {
            return ['table', m.projectId, topic.replace(/\W/g, '')].join('-');
        }

        return view;
    }


    // Binding/Models
    //
    function CellModel(obj, path) {
        var M = {};
        M.value = obj[path]; // binded!
        M.save = saveValue;
        M.toString = toString;


        var oldValue = M.value;

        function saveValue() {
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
            return val;
        }

        return M;
    }

    // Export
    //
    function Exporter() {
        var E = {};
        E.getCsv = getCsv;

        function getCsv(view) {
            var res = '';

            // Header
            res += getRowStr(view.header, function (th) {
                return th().label;
            });
            //console.log('>>> CSV Titles: ', res);

            // Rows
            view.rows.forEach(function (row) {
                res += getRowStr(row().list, function (item) {
                    var cell = item();
                    return (cell.type === 'static') ? cell.label :
                        (cell.type === 'icon') ? !!cell.label : cell.model.toString();
                });
            });
            //console.log('>>> CSV Rows: ', res);

            // Footer
            res += getRowStr(view.footer, function (th) {
                var cell = th();
                return (cell.type === 'static') ? cell.label : cell.value();
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


    // Data formats:
    //
    //@formatter:off
    /* table = [{
        "reqId": "",
        "name": "",
        "mandatory": true|false,
        "weight": 1,
        "popularity": 0,
        "products": [{
            "prodId": "",
            "name": "",
            "input": "",
            "grade": 0,
            "popularity": 0
        }]

        topicWeights = [{
          "topic": "",
          "weight": 0-1
        }]
    }]*/
    //@formatter:on
}
