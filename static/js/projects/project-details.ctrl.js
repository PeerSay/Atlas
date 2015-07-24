/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$scope', '$rootScope', '$stateParams', '$filter', 'Projects', 'budgetFilter', 'FullScreen'];
function ProjectDetailsCtrl($scope, $rootScope, $stateParams, $filter, Projects, budgetFilter, FullScreen) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
    m.requirements = [];
    m.products = [];
    // Presentations
    m.presentations = [];
    m.createPresentation = createPresentation;

    //UI helpers
    m.sidebar = {
        amountText: amountText,
        amountHtml: amountHtml,
        dateDurationText: dateDurationText
    };
    //Full screen
    m.fullscreen = FullScreen;

    activate();

    function activate() {
        readProject();
        readPresentations();

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

    // Presentations
    //
    function readPresentations() {
        Projects.readPresentations(m.projectId).then(function (res) {
            m.presentations = res.presentations;
        });
    }

    function createPresentation() {
        var data = { title: m.project.title };
        Projects.createPresentation(m.projectId, data).then(function (res) {
            m.presentations.push(res);
        });
    }

    // UI helpers
    function amountHtml() {
        return budgetFilter(m.project.budget);
    }

    function amountText() {
        return budgetFilter(m.project.budget, true);
    }

    function dateDurationText() {
        var text = '';
        if (m.project.time.duration) {
            text += [m.project.time.duration, m.project.time.durationLabel, ' '].join(' ');
        }
        if (m.project.time.startDate) {
            var date = $filter('date')(m.project.time.startDate, 'MM/dd/yyyy');
            text += ['@', date].join(' ');
        }
        return text;
    }
}
