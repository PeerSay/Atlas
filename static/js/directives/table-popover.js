angular
    .module('peersay')
    .directive('psTablePopover', psTablePopover);

psTablePopover.$inject = ['$timeout'];
function psTablePopover($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'html/table-popover.html',
        replace: true,
        transclude: true,
        scope: {
            popoverOn: '=psPopoverOn',
            allowHide: '&psAllowHide'
        },
        link: function (scope, element, attrs, ctrls, transcludeFn) {
            // Using transcludeFn option, because we need to replace 2 els in template:
            // icon and form. ngTransclude allows to replace only one.
            //
            transcludeFn(function (clone) {
                if (!element.parent().length) {
                    // XXX - unclear why it is called second time when directive is inside <th>!
                    return;
                }

                var id = attrs.psId;
                var manualHide = false;
                var $tIcon = clone.filter('.popover-icon');
                var $tForm = clone.filter('form');
                var $icon = element.find('.js-popover-icon');
                var $cont = element.parents(attrs.psContSelector);
                var $table = element.parents('table');
                var $el = element.find('button');

                // insert icon
                $icon.replaceWith($tIcon);

                // init popover plugin
                $el.popover({
                    container: $cont,
                    viewport: $table,
                    trigger: 'focus',
                    html: true,
                    content: function () {
                        // called on trigger
                        return $tForm;
                    }
                });

                scope.$watch('popoverOn', function (newVal) {
                    if (newVal !== id) {
                        hide();
                    }
                });

                $el.on('show.bs.popover', function () {
                    scope.$apply(function () {
                        scope.popoverOn = id;
                    });
                });

                $el.on('hide.bs.popover', function (e) {
                    if (manualHide) {
                        manualHide = false;
                        return;
                    }

                    // delay until it is clear that it is not a click on popover
                    e.preventDefault();

                    $timeout(function () {
                        if (scope.allowHide() !== false) { // may be false, true & undefined
                            hide();
                        }
                    }, 100, false);
                });

                function hide() {
                    manualHide = true;
                    $el.popover('hide');
                }

                // Clean-up
                element.on('$destroy', function () {
                    $el.off('show.bs.popover hide.bs.popover');
                });
            });
        }
    };
}