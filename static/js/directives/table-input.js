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
            var $td = $el.parents('td');
            var $tr = $td.parent();
            var cell = scope.$eval(attrs.psTableInput);
            var model = cell.model;

            // This fixes table cell's save logic for type=number inputs in Firefox.
            // Firefox (unlike Chrome) does not focus input when spinner buttons are clicked, thus it breaks
            // save logic based on assumption that edited element is focused and blur triggers update.
            $el.on('input', function () {
                // 'input' event is triggered on clicking spinner button
                $(this).focus();
            });

            // Make active on clicking cell outside input (of cell is larger)
            $td.click(function () {
                $el.focus();
            });

            // Toggle 'edit' class on focus/blur
            $el.on('focus', function () {
                $td.addClass('edited');
            });

            // Save model
            $el.on('blur', function () {
                $td.removeClass('edited');
                scope.$apply(function () {
                    model.save();
                });
            });

            // Mute zero-weight rows
            if (cell.muteOnZero) {
                scope.$watch(function () {
                    return model.value;
                }, function (newVal/*, oldVal*/) {
                    $tr.toggleClass('muted', !newVal);
                })
            }

        }
    };
}