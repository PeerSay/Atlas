/*global angular:true*/

angular.module('PeerSay')
    .controller('MenuCtrl', MenuCtrl);


MenuCtrl.$inject = ['$state', 'User', 'Projects', 'Notify'];
function MenuCtrl($state, User, Projects, Notify) {
    var m = this;
    m.notify = Notify;
    m.user = {
        displayName: '',
        logout: User.logout.bind(User)
    };
    m.project = {
        toggleCreateDlg: Projects.toggleCreateDlg.bind(Projects)
    };

    //TODO - real data
    m.peers = {
        list: [
            {email: 'my@team', online: true},
            {email: 'my@team2', online: false},
            {email: 'mate@me', online: true}
        ],
        toggle: false
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
