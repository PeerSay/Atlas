/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDashboardCtrl', ProjectDashboardCtrl);

ProjectDashboardCtrl.$inject = ['$stateParams', 'Projects', 'Util'];
function ProjectDashboardCtrl($stateParams, Projects, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
    m.loading = true;
    m.essentials = {
        data: {},
        initialized: false
    };
    m.products = {
        data: [],
        initialized: false
    };
    m.requirements = {
        data: [],
        initialized: false
    };
    m.decisions = {
        data: [],
        initialized: false
    };


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            initFields(res);

            return (m.project = res);
        }).then(function () {
            var tableOk = m.decisions.initialized = (m.products.initialized && m.requirements.initialized);
            if (!tableOk) { return; }

            Projects.readProjectTable(m.projectId).then(function (res) {
                m.decisions.data = findWinners(res.table);
            });

            m.loading = false;
        });
    }

    function initFields(project) {
        angular.extend(m.essentials.data, {
            goals: project.notes.goals,
            category: project.selectedCategory || null,
            budget: project.budget,
            duration: project.time.duration,
            durationLabel: project.time.durationLabel
        });
        m.essentials.initialized = hasAnyValue(m.essentials.data, ['goals', 'category', 'budget', 'duration']);

        m.products.data = project.products;
        var selectedProducts = _.filter(project.products, function (it) { return !!it.selected; });
        m.products.initialized = (selectedProducts.length > 0);

        m.requirements.data = project.requirements;
        var selectedReqs = _.filter(project.requirements, function (it) { return !!it.selected; });
        m.requirements.initialized = (selectedReqs.length > 0);
    }

    function hasAnyValue(obj, keys) {
        var res = false;
        angular.forEach(keys, function (key) {
            if (obj[key]) {
                res = true;
            }
        });
        return res;
    }

    function findWinners(table) {
        var totalWeight = 0;
        var products = [];

        _.forEach(table, function (req) {
            totalWeight += req.weight;

            _.forEach(req.products, function (prod, idx) {
                var p = products[idx] = products[idx] || {
                        name: prod.name,
                        grade: 0
                    };
                p.grade += prod.grade * req.weight;
            });
        });
        //console.log('>> totalWeight', totalWeight);

        var maxGrade = products.reduce(function (prev, current) {
            var totalGrade = current.totalGrade = weightedGrade(current.grade, totalWeight);
            return Math.max(totalGrade, prev);
        }, 0);
        //console.log('>>max', maxGrade);

        var res = _.filter(products, function (prod) {
            return (prod.totalGrade === maxGrade);
        });
        return res;
    }

    function weightedGrade(grade, weight) {
        var ave = weight ? grade / weight : 0;
        var gradeAve = !ave ? 0 : Math.round(ave * 10) / 10;
        return gradeAve;
    }
}
