angular
    .module('PeerSay')
    .directive('psReqEditForm', psReqEditForm);

function psReqEditForm() {
    return {
        restrict: 'E',
        templateUrl: 'html/requirements-edit-form.html',
        scope: {
            ctl: '=psCtl',
            disableName: '=psDisableName',
            disableTopic: '=psDisableTopic'
        },
        link: function (scope, element, attrs) {
            var $btn = $(attrs.psBtnSelector).click(toggle);

            scope.$watch('ctl.visible', function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    $btn.toggleClass('active', newVal);
                }
            });

            function toggle() {
                scope.$apply(function () {
                    scope.ctl.toggle();
                });

                return false; //prevent propagation
            }

            //Clean-up
            element.on('$destroy', function () {
                $btn.off('click');
            });
        }
    };
}
