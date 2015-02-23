/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectListCtrl', ProjectListCtrl);

ProjectListCtrl.$inject = ['Projects'];
function ProjectListCtrl(Projects) {
    var m = this;

    m.projects = [];
    m.create = Projects.create;
    m.toggleCreateDlg = Projects.toggleCreateDlg.bind(Projects);
    m.createProject = Projects.createProject.bind(Projects);
    m.removeProject = Projects.removeProject.bind(Projects);

    Projects.getProjectStubs()
        .then(function (projects) {
            m.projects = projects;
        });
}
