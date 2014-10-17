/*global angular:true*/

angular.module('peersay')
    .controller('ProjectListCtrl', ProjectListCtrl)
    .controller('ProjectDetailsCtrl', ProjectDetailsCtrl);

ProjectListCtrl.$inject = ['Projects'];

function ProjectListCtrl(Projects) {
    var m = this;

    m.projects = Projects.projects;
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = Projects.createProject.bind(Projects);
}


ProjectDetailsCtrl.$inject = ['Projects', '$routeParams'];

function ProjectDetailsCtrl(Projects, $routeParams) {
    var m = this;
    var id = Number($routeParams.id);

    m.project = $.map(Projects.projects, function (p) {
        return (p.id !== id) ? null : p;
    })[0];
}
