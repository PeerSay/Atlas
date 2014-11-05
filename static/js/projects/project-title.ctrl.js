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

    getProject();

    function getProject() {
        // TODO: fix double API call
        Projects.getProject(id)
            .success(function () {
                m.project = Projects.curProject;
            });
    }

    function toggleEditTitleDlg(on) {
        if (on) {
            m.editTitle.value = Projects.curProject.title;
        }
        m.editTitle.show = on;
    }

    function updateProjectTitle() {
        Projects.updateProject()
            .then(function () {
                // TODO: use response
                Projects.curProject.title = m.editTitle.value;
            })
            .finally(function () {
                m.editTitle.show = false;
            });
    }
}
