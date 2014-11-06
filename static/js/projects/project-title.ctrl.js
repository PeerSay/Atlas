/*global angular:true*/

angular.module('peersay')
    .controller('ProjectTitleCtrl', ProjectTitleCtrl);


ProjectTitleCtrl.$inject = ['$routeParams', 'Projects'];
function ProjectTitleCtrl($routeParams, Projects) {
    var m = this;
    var id = Number($routeParams.projectId);

    m.project = {};
    m.editTitle = {
        show: false,
        value: ''
    };
    m.toggleEditTitleDlg = toggleEditTitleDlg;
    m.updateProjectTitle = updateProjectTitle;

    readProject();

    function readProject() {
        Projects.readProject(id)
            .then(function (res) {
                m.project = res;
            });
    }

    function toggleEditTitleDlg(on) {
        if (on) {
            m.editTitle.value = m.project.title;
        }
        m.editTitle.show = on;
    }

    function updateProjectTitle() {
        var title = m.editTitle.value.trim();
        Projects.updateProject(id, {title: title})
            .success(function (res) {
                m.project.title = res.result.title;
            })
            .finally(function () {
                m.editTitle.show = false;
            });
    }
}
