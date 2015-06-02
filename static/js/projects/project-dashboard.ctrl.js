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
    m.products = {};
    m.requirements = {};


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            initFields(res);
            return (m.project = res);
        });
    }

    function initFields(project) {
        angular.extend(m.essentials.data, {
            goals: project.goals,
            category: (project.selectedCategory || {}).name,
            budget: project.resources.budget,
            duration: project.time.duration,
            durationLabel: project.time.durationLabel
        });
        m.essentials.initialized = isInitialized(m.essentials.data, ['goals', 'category', 'budget', 'duration']);


    }

    function isInitialized(obj, keys) {
        var res = false;
        angular.forEach(keys, function (key) {
            if (obj[key]) {
                res = true;
            }
        });
        return res;
    }
}
