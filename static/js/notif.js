/*global angular:true*/

angular.module('PeerSay')
    .factory('Notification', Notification)
    .controller('NotificationCtrl', NotificationCtrl);

function Notification() {
    var N = {};
    N.error = {
        show: false,
        title: '',
        msg: ''
    };
    N.showError = showError;
    N.hideError = hideError;

    function showError(title, msg) {
        N.error.show = true;
        N.error.title = title;
        N.error.msg = msg;
    }

    function hideError() {
        N.error.show = false;
        N.title = '';
        N.msg = '';
    }
    return N;
}

NotificationCtrl.$inject = ['Notification'];
function NotificationCtrl(Notification) {
    var m = this;
    m.error = Notification.error;
    m.hide = Notification.hideError;
}