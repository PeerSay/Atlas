/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDashboardCtrl', ProjectDashboardCtrl);

ProjectDashboardCtrl.$inject = ['$stateParams', 'Projects', 'Util'];
function ProjectDashboardCtrl($stateParams, Projects, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
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


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            initFields(res);
            return (m.project = res);
        });
    }

    function initFields(project) {
        angular.extend(m.essentials.data, {
            goals: project.notes.goals,
            category: project.selectedCategory || null,
            budget: project.budget.amount,
            duration: project.time.duration,
            durationLabel: project.time.durationLabel
        });
        m.essentials.initialized = hasAnyValue(m.essentials.data, ['goals', 'category', 'budget', 'duration']);

        m.products.data = project.products;
        m.products.initialized = (project.products.length > 0);

        m.requirements.data = project.requirements;
        m.requirements.initialized = (project.requirements.length > 0);
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
}
