/*global angular:true*/

angular.module('peersay')
    .controller('ProjectListCtrl', ProjectListCtrl)
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectListCtrl.$inject = ['Projects', '$routeParams'];
function ProjectListCtrl(Projects, $routeParams) {
    var m = this;
    var user_id = Number($routeParams.id);

    m.projects = [];
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = Projects.createProject.bind(Projects);
    m.removeProject = Projects.removeProject.bind(Projects);

    Projects
        .getProjects(user_id)
        .success(function () {
            m.projects = Projects.projects;
        });
}


ProjectDetailsCtrl.$inject = ['Projects', '$routeParams'];
function ProjectDetailsCtrl(Projects, $routeParams) {
    var m = this;
    var id = Number($routeParams.id);

    m.project = $.map(Projects.projects, function (p) {
        return (p.id !== id) ? null : p;
    })[0];
}
