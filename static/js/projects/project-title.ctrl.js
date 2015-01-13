/*global angular:true*/

angular.module('peersay')
    .controller('ProjectTitleCtrl', ProjectTitleCtrl);


ProjectTitleCtrl.$inject = ['$scope', 'Projects'];
function ProjectTitleCtrl($scope, Projects) {
    var m = this;

    m.projectId = $scope.$parent.m.projectId;
    m.title = {};
    m.editTitle = {
        show: false,
        value: ''
    };
    m.toggleEditTitleDlg = toggleEditTitleDlg;
    m.updateProjectTitle = updateProjectTitle;

    activate();

    function activate() {
        Projects.readProject(m.projectId)
            .then(function () {
                m.title = Projects.current.project.title;
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
        Projects.updateProject(m.projectId, { title: title })
            .then(function (res) {
                m.title = res.title;
            })
            .finally(function () {
                m.editTitle.show = false;
            });
    }
}
