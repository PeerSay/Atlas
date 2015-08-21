angular
    .module('PeerSay')
    .directive('psProgress', psProgress);

function psProgress() {
    return {
        restrict: 'E',
        scope: {
            value: '='
        },
        replace: true,
        template: [
            '<div class="progress">',
                '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{{:: value }}">',
                    '<span class="sr-only">{{:: value }}%</span>',
                '</div>',
            '</div>'
        ].join(''),
        link: function (scope, element) {
            var $el = $(element).find('.progress-bar');

            updateStyle();

            function updateStyle() {
                $el.css({
                    width: scope.value + '%',
                    backgroundColor: getBgColor(scope.value)
                });
            }

            function getBgColor(val) {
                var colorTpl = 'hsl($$, 81%, 58%)';
                var hueStart = -3, hueStop = 165;
                var hue = hueStart + Math.floor((hueStop - hueStart) * val / 100);
                var color = colorTpl.replace('$$', hue);
                return color;
            }
        }
    };
}
