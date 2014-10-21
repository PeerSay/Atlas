/*global angular:true*/

angular.module('peersay')
    .factory('Menu', Menu)
    .controller('MenuCtrl', MenuCtrl);


function Menu() {
    var M = {};
    M.activePage = {};
    M.setActivePage = function (value) {
        M.activePage.name = value;
    };

    return M;
}

MenuCtrl.$inject = ['Menu', 'Users', 'Projects'];
function MenuCtrl(Menu, Users, Projects) {
    var m = this;
    m.activePage = Menu.activePage;
    m.user = {
        logout: Users.logout.bind(Users)
    };
    m.project = {
        toggleCreateDlg: Projects.toggleCreateDlg.bind(Projects)
    };
}