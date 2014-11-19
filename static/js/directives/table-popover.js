angular
    .module('peersay')
    .directive('psTablePopover', psTablePopover);

psTablePopover.$inject = ['$timeout', '$compile'];
function psTablePopover($timeout, $compile) {
    return {
        restrict: 'E',
        templateUrl: 'html/table-popover.html',
        transclude: true,
        link: function (scope, element) {
            var $form = element.find('.js-form');
            var $td = $form.parents('td');
            var $table = $form.parents('table');
            var $el = element.find('button').popover({
                container: $td,
                viewport: $table,
                trigger: 'manual',
                html: true,
                content: function () {
                    // Transcluded (by directive) elements are reused due to jQ append()
                    // A better way would probably be calling transcludeFn
                    return $form.removeAttr('hidden');
                }
            });
            scope.show = false;

            $el.on('focusin', function () {
                // Delaying so that it comes after click if it's focus on click (not on tab),
                // otherwise click will negate the effect
                $timeout(function () {
                    scope.$apply(function () {
                        scope.ctl.popoverOn = scope.criteria;
                    });
                }, 100, false);
            });

            $el.on('click', function () {
                scope.$apply(function () {
                    scope.show = !scope.show;
                    scope.ctl.popoverOn = scope.show ? scope.criteria : null;
                });
            });

            scope.$watch('ctl.popoverOn', function (newVal) {
                //console.log('>>[%s] ctl.popoverOn ', scope.criteria.name, newVal);
                scope.show = (newVal === scope.criteria);
                $el.popover(scope.show ? 'show' : 'hide');

                if(!scope.show) {
                    scope.criteria.newGroup = {}; //hide edit too
                }
            });

            // Clean-up
            element.on('$destroy', function () {
                $el.off('focusin click');
            });
        }
    };
}