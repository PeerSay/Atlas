/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectListCtrl', ProjectListCtrl);

ProjectListCtrl.$inject = ['$state', 'Projects'];
function ProjectListCtrl($state, Projects) {
    var m = this;

    m.projects = [];
    m.newProject = {
        category: '',
        customCategory: false
    };
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = createProject;
    m.removeProject = removeProject;
    m.editProject = editProject;

    activate();

    function activate() {
        Projects.getProjectStubs().then(function (projects) {
            m.projects = projects;
        });
    }

    function createProject() {
        Projects.createProject(m.newProject).then(function (prj) {
            editProject(prj.id);
        });
    }

    function editProject(id) {
        return $state.go('project.details.decisions', {projectId: id});
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
