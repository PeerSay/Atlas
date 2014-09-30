/*global angular:true, io:true*/

angular.module('peersay')
    .factory('socket', socketSvc);

socketSvc.$inject = ['$rootScope'];

function socketSvc($rootScope) {
    var socket = window.io && io();
    var dummy = function () {
    };
    if (!socket) {
        return { on: dummy, emit: dummy };
    }

    var service = {
        on: on,
        emit: emit
    };
    return service;


    function on(evt, callback) {
        socket.on(evt, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                callback.apply(socket, args);
            });
        });
    }

    function emit(evt, data, callback) {
        socket.emit(evt, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                if (callback) {
                    callback.apply(socket, args);
                }
            });
        });
    }
}