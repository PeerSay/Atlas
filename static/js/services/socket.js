/*global angular:true, io:true*/

angular.module('peersay').factory('socket', function ($rootScope) {
    var dummy = function () {};
    var socket = window.io && io();

    if (!socket) {
        return { on: dummy, emit: dummy };
    }

    return {
        on: function (evt, callback) {
            socket.on(evt, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (evt, data, callback) {
            socket.emit(evt, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
});
