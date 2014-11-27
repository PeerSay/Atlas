angular
    .module('peersay')
    .directive('psTableThPopover', psTableThPopover);

psTableThPopover.$inject = ['$timeout'];
function psTableThPopover($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'html/table-th-popover.html',
        replace: true,
        transclude: true,
        link: function (scope, element, attrs) {
            if (!element.parent().length) {
                // XXX - unclear why it is called second time!
                return;
            }

            // TODO - unify with table-popover directive!

            var $form = element.find('.js-form');
            var $cont = element.parents('th');
            var $table = element.parents('table');
            var $el = element.find('button');
            $el.popover({
                container: $cont,
                viewport: $table,
                trigger: 'manual',
                html: true,
                content: function () {
                    // Transcluded (by directive) elements are reused due to jQ append()
                    // A better way would probably be calling transcludeFn
                    return $form.removeAttr('hidden');
                }
            });
            scope.showMe = false;

            $el.on('focusin', function () {
                // Delaying so that it comes after click if it's focus on click (not on tab),
                // otherwise click will negate the effect
                $timeout(function () {
                    scope.$apply(function () {
                        scope.showMe = true;
                        scope.ctl.popoverOn = 'table';
                    });
                }, 100, false);
            });

            $el.on('click', function () {
                scope.$apply(function () {
                    scope.showMe = !scope.showMe;
                    scope.ctl.popoverOn = scope.showMe ? 'table' : null;
                });
            });

            scope.$watch('ctl.popoverOn', function (newVal) {
                scope.showMe = (newVal === 'table');
                $el.popover(scope.showMe ? 'show' : 'hide');
            });

            // Clean-up
            element.on('$destroy', function () {
                $el.off('focusin click');
            });
        }
    };
}