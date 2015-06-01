/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectDetailsCtrl.$inject = ['$stateParams', '$state', 'Projects', 'Util'];
function ProjectDetailsCtrl($stateParams, $state, Projects, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    //Model
    m.project = null;
    m.requirements = [];
    m.products = [];

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function (res) {
                m.requirements = res.requirements;
                m.products = res.products;

                return (m.project = res);
            });
    }
}
