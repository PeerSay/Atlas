angular
    .module('PeerSay')
    .directive('psEditInline', psEditInline);

function psEditInline() {
    return {
        restrict: 'E',
        templateUrl: 'html/edit-inline.html',
        scope: {
            model: '=',
            label: '@',
            onSave: '&'
        },
        link: function (scope, element, attrs) {
            var model = scope.model;
            scope.show = false;
            scope.toggle = toggle;
            scope.save = save;
            scope.cancel = cancel;
            scope.onKeydown = onKeydown;

            function toggle(show) {
                scope.show = show;
            }

            function onKeydown(evt) {
                var isEsc = (evt.keyCode === 27);
                if (isEsc) {
                    cancel();
                }
            }

            function save() {
                toggle(false);
                if (model.value === model.lastValue) { return; }

                scope.onSave()
                    .then(function () {
                        model.lastValue = model.value;
                    });
            }

            function cancel() {
                model.value = model.lastValue;
                toggle(false);
            }

        }
    };
}