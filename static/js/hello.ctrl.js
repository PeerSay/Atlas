/*global angular:true*/

angular.module('peersay')
    .controller('hello', hello);

hello.$inject = ['restApi', 'socket'];

function hello(rest, socket) {
    var m = this;

    m.helloMsg = 'Hello World!';
    m.helloApi = '';
    m.getHello = getHello;
    m.socketMsg = '';

    getHello();


    function getHello() {
        return rest.getHello().then(function (res) {
            if (res.error) {
                throw new Error(res.message);
            } else {
                m.helloApi = JSON.stringify(res.data);
                return m.helloApi;
            }
        });
    }

    socket.on('msg', function (msg) {
        m.socketMsg = msg;
    });
}
