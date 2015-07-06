/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectListCtrl', ProjectListCtrl);

ProjectListCtrl.$inject = ['$state', '$timeout', 'Projects'];
function ProjectListCtrl($state, $timeout, Projects) {
    var m = this;

    m.projects = [];
    m.create = Projects.create;
    m.creating = false;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.removeProject = removeProject;
    m.createProject = createProject;
    m.editProject = editProject;

    Projects.getProjectStubs()
        .then(function (projects) {
            m.projects = projects;
        });

    function createProject() {
        m.creating = true;
        Projects.createProject()
            .then(function (prj) {
                editProject(prj.id);
            })
            .finally(function () {
                m.creating = false;
            });
    }

    function editProject(id) {
        return $state.go('project.details.dashboard', {projectId: id});
    }

    function removeProject(prj) {
        prj.muted = true;
        Projects.removeProject(prj.id)
            .finally(function () {
                // in case of error - do not left in spinning state
                prj.muted = false;
            });
    }
}
