/*global angular:true*/

angular
    .module('PeerSay')
    .controller('MenuCtrl', MenuCtrl);


MenuCtrl.$inject = ['$state', 'User', 'Projects', 'Notify', '$timeout'];
function MenuCtrl($state, User, Projects, Notify, $timeout) {
    var m = this;
    m.notify = Notify;
    m.user = {
        displayName: '',
        logout: User.logout.bind(User)
    };
    m.project = {
        toggleCreateDlg: Projects.toggleCreateDlg.bind(Projects)
    };
    m.peers = Peers();

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


    // Peers class
    //
    function Peers() {
        var P = {};
        P.list = [];
        P.toggle = false;
        P.load = load;
        P.loading = false;

        function load() {
            console.log('>> Loading...');
            P.loading = true;

            //TODO - real data
            $timeout(function () {
                P.list = [
                    {email: 'my@team', online: true},
                    {email: 'my@team2', online: false},
                    {email: 'mate@me', online: true}
                ];
                P.list.forEach(function (it) {
                    it.online = (Math.random() >.5 );
                });
                P.loading = false;
            }, 500);
        }

        return P;
    }
}
