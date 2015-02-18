angular
    .module('PeerSay')
    .directive('psProgress', psProgress);

function psProgress() {
    return {
        restrict: 'E',
        scope: {
            value: '=valuenow',
            style: '='
        },
        replace: true,
        template: [
            '<div class="progress">',
                '<div class="progress-bar progress-bar-{{style}}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{value}}"  style="width: {{value}}%;">',
                    '<span class="sr-only">{{value}}% Complete (success)</span>',
                '</div>',
            '</div>'
        ].join('')
    };
}