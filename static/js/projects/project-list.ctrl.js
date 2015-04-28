/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectListCtrl', ProjectListCtrl);

ProjectListCtrl.$inject = ['$state', '$timeout', 'Projects', 'Wizard', 'Util'];
function ProjectListCtrl($state, $timeout, Projects, Wizard, _) {
    var m = this;

    m.projects = [];
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.removeProject = Projects.removeProject.bind(Projects);
    m.createProject = createProject;
    m.editProject = editProject;

    Projects.getProjectStubs()
        .then(function (projects) {
            m.projects = projects;
        });

    function createProject() {
        Projects.createProject()
            .then(function (prj) {
                editProject(prj.id, true/*isNew*/);
            });
    }

    function editProject(id, isNew) {
        $state.go('project.details', {projectId: id})
            .then(function () {
                var curStepNum = Wizard.current.stepNum; // resolved by now

                // $timeout prevents a case when location replace wipes previous state and
                // incorrect navigation on back button, sometimes even out of the app
                $timeout(function () {
                    $state.go('.steps', {step: curStepNum}, {location: 'replace'})
                        .then(function () {
                            if (!isNew) { return; }

                            $timeout(function () {
                                $state.go('.essentials');
                            })
                        });
                }, 0)
            });

    }
}
