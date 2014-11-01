/*global angular:true*/

angular.module('peersay')
    .controller('ProjectListCtrl', ProjectListCtrl);

ProjectListCtrl.$inject = ['Projects', '$routeParams'];
function ProjectListCtrl(Projects, $routeParams) {
    var m = this;

    m.projects = [];
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = Projects.createProject.bind(Projects);
    m.removeProject = Projects.removeProject.bind(Projects);

    Projects
        .getProjects()
        .success(function () {
            m.projects = Projects.projects;
        });
}