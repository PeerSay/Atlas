/*global angular:true*/

angular.module('PeerSay')
    .controller('MenuCtrl', MenuCtrl);


MenuCtrl.$inject = ['$state', 'User', 'Projects'];
function MenuCtrl($state, User, Projects) {
    var m = this;
    m.user = {
        displayName: '',
        logout: User.logout.bind(User)
    };
    m.project = {
        toggleCreateDlg: Projects.toggleCreateDlg.bind(Projects)
    };

    activate();

    function activate() {
        if (!isLoggedState()) { return; }

        User.readUser()
            .then(function (user) {
                m.user.displayName = user.name || user.email;
                return user;
            });
    }

    function isLoggedState() {
        return $state.includes('project');
    }
}
