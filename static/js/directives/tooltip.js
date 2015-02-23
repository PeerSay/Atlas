angular
    .module('PeerSay')
    .directive('psTooltip', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var title = '';
                var $el = $(element)
                    .tooltip({
                        delay: { "show": 600, "hide": 100 },
                        title: function () {
                            return title;
                        }
                    })
                    .click(function () {
                        $el.tooltip('hide');
                    });

                scope.$watch(attrs.psTooltipTitle, function(value) {
                    title = value;
                });

            }
        };
    });