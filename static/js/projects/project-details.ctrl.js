/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$scope', '$rootScope', '$stateParams', 'Projects'];
function ProjectDetailsCtrl($scope, $rootScope, $stateParams, Projects) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
    m.requirements = [];
    m.products = [];
    //UI helpers
    m.sidebar = {
        amountText: amountText,
        dateDurationText: dateDurationText
    };

    activate();

    function activate() {
        readProject();

        // Re-read on navigation to get fresh (not cached) object
        var off = $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
            if(toState.name === 'project.list') { return; } // back to list
            readProject();
        });

        $scope.$on('$destroy', off);
    }

    function readProject() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.requirements = res.requirements;
            m.products = res.products;
            return res;
        });
    }

    // UI helpers
    function amountText() {
        if (!m.project.budget.amount) {
            return '';
        }
        return [m.project.budget.amount, m.project.budget.amountMultiplier].join(' ');
    }

    function dateDurationText() {
        var text = '';
        if (m.project.time.duration) {
            text += [m.project.time.duration, m.project.time.durationLabel, ' '].join(' ');
        }
        if (m.project.time.startDate) {
            text += ['@', m.project.time.startDate].join(' ');
        }
        return text;
    }
}
