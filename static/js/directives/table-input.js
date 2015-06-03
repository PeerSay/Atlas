angular
    .module('PeerSay')
    .directive('psTableInput', psTableInput);

function psTableInput() {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function (scope, element, attrs, ngModel) {
            if (!ngModel) { return; }

            var $el = $(element);
            var model = scope.$eval(attrs.psTableInput);

            // This fixes table cell's save logic for type=number inputs in Firefox.
            // Firefox (unlike Chrome) does not focus input when spinner buttons are clicked, thus it breaks
            // save logic based on assumption that edited element is focused and blur triggers update.
            $el.on('input', function () {
                // 'input' event is triggered on clicking spinner button
                $(this).focus();
            });


            $el.on('blur', function () {
                scope.$apply(function () {
                    model.save();
                });
            });

        }
    };
}