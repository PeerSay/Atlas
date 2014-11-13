angular
    .module('peersay')
    .directive('psProgress', psProgress);

function psProgress() {
    return {
        restrict: 'E',
        scope: {
            value: '=valuenow',
            style: '='
        },
        template: [
            '<div class="progress">',
                '<div class="progress-bar progress-bar-{{style}} progress-bar-striped" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{value}}"  style="width: {{value}}%;">',
                    '{{value}}%',
                '</div>',
            '</div>'
        ].join('')
    };
}