/*global angular:true*/

angular.module('peersay')
    .controller('ProjectListCtrl', ProjectListCtrl)
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl)
    .controller('MenuCtrl', MenuCtrl);

ProjectListCtrl.$inject = ['Projects'];
function ProjectListCtrl(Projects) {
    var m = this;

    m.projects = [];
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = Projects.createProject.bind(Projects);
    m.removeProject = Projects.removeProject.bind(Projects);

    Projects
        .getProjects()
        .then(function () {
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


MenuCtrl.$inject = ['Projects']; // TODO: to proper place
function MenuCtrl(Projects) {
    var m = this;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
}