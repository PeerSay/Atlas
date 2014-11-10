/*global angular:true*/

angular.module('peersay')
    .controller('ProjectTitleCtrl', ProjectTitleCtrl);


ProjectTitleCtrl.$inject = ['$routeParams', 'Projects'];
function ProjectTitleCtrl($routeParams, Projects) {
    var m = this;
    var id = $routeParams.projectId;

    m.title = {};
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
                m.title = res.title;
            });
    }

    function toggleEditTitleDlg(on) {
        if (on) {
            m.editTitle.value = m.title.value;
        }
        m.editTitle.show = on;
    }

    function updateProjectTitle() {
        var title = m.editTitle.value.trim();
        Projects.updateProject(id, {title: title})
            .success(function (res) {
                m.title.value = res.result.title;
                m.title.ok = true; // TODO
                m.title.default = false;
            })
            .finally(function () {
                m.editTitle.show = false;
            });
    }
}
