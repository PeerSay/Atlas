angular
    .module('peersay')
    .directive('psTablePopover', psTablePopover);

function psTablePopover() {
    return {
        restrict: 'E',
        templateUrl: 'html/table-popover.html',
        transclude: true,
        scope: {
            title: '@',
            criteria: '='
        },
        link: function (scope, element) {
            var $form = element.find('.js-form');
            var parentSel = '#popover-' + scope.criteria.id;

            var $el = element.find('button').popover({
                container: parentSel,
                viewport: $form.parents('.table'),
                trigger: 'click',
                html: true,
                content: function () {
                    return $form.removeAttr('hidden'); // moved in DOM!
                }
            });

            /*$el.on('focusin', function () {
                scope.$apply(function () {
                    scope.criteria.advanced = true;
                });
            });*/

            scope.$watch('criteria.advanced', function (newVal) {
                $el.popover(newVal ? 'show' : 'hide');
            });


            // Clean-up
            element.on('$destroy', function () {
                console.log('>> Destroyed', parentSel);
                $el.off('hide.bs.popover');
            });
        }
    };
}