/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$rootScope', '$stateParams', 'Projects'];
function ProjectDetailsCtrl($rootScope, $stateParams, Projects) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
    m.requirements = [];
    m.products = [];

    activate();

    function activate() {
        readProject();

        // Re-read on navigation to get fresh (not cached) object
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
            readProject();
        });
    }

    function readProject() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.requirements = res.requirements;
            m.products = res.products;
            return res;
        });
    }
}
