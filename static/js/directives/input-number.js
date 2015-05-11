angular
    .module('PeerSay')
    .directive('psInputNumber', psInputNumber);

// This directive fixes table cell's save logic for type=number inputs in Firefox.
// Firefox (unlike Chrome) does not focus input when spinner buttons are clicked, thus it breaks
// save logic based on assumption that edited element is focused and blur triggers update.

function psInputNumber() {
    return {
        restrict: 'A',
        link: function (scope, element) {
            $(element).on('input', function () {
                // 'input' event is triggered on clicking spinner button
                $(this).focus();
            });
        }
    };
}