angular
    .module('PeerSay')
    .directive('psTooltip', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var $el = $(element)
                    .tooltip({
                        delay: { "show": 400, "hide": 50 }
                    });

                scope.$watch(attrs.psTooltipTitle, function(value) {
                    updateTitle(value);
                });

                function updateTitle(newTitle) {
                    $el.attr('title', newTitle)
                        .tooltip('fixTitle')
                        .parent().find('.tooltip .tooltip-inner')
                        .text(newTitle);
                }

            }
        };
    });