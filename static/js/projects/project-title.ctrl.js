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
        Projects.updateProject(m.projectId, {title: title})
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
