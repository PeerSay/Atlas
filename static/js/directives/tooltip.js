angular
    .module('PeerSay')
    .directive('psTooltip', function () {
        return {
            restrict: 'A',
            link: function (scope, element) {
                var $el = $(element)
                    .tooltip({
                        delay: { "show": 600, "hide": 100 }
                    })
                    .click(function () {
                        $el.tooltip('hide');
                    });
            }
        };
    });