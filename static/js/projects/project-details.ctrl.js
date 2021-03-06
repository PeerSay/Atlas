/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$scope', '$rootScope', '$stateParams', 'Projects', 'StorageRecord'];
function ProjectDetailsCtrl($scope, $rootScope, $stateParams, Projects, StorageRecord) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
    m.requirements = [];
    m.products = [];
    m.snapshots = [];
    //Full screen
    m.fullScreen = StorageRecord.boolean('fs');
    m.noMenu = StorageRecord.boolean('no-menu');

    activate();

    function activate() {
        readProject();

        // Re-read on navigation to get fresh (not cached) objects
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
            m.snapshots = res.presentation.snapshots;
            return res;
        });
    }
}
