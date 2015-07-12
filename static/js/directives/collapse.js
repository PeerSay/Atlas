angular
    .module('PeerSay')
    .directive('psCollapse', psCollapse);

function psCollapse() {
    return {
        restrict: 'A',
        scope: {
            ctl: '=psCollapse'
        },
        link: function (scope, element, attr) {
            var $el = $(element).collapse({
                parent: attr.psCollapseParent
            });

            scope.$watch('ctl.open', function (newVal) {
                if (!angular.isDefined(newVal)) { return; }
                $el.collapse(newVal ? 'show' : 'hide');
            });

            $el.on('shown.bs.collapse hidden.bs.collapse', function (evt) {
                scope.$apply(function () {
                    scope.ctl.open = (evt.type !== 'hidden');
                });
            });

            // Clean-up
            element.on('$destroy', function () {
                $el.off('shown.bs.collapse hidden.bs.collapse');
            });

        }
    };
}