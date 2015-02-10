angular.module('peersay')
    .filter('multiline', multiline);

function multiline() {
    return function (item) {
        return (''+item).replace(/\n/g, '<br>');
    };
}