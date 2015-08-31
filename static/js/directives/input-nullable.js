angular
    .module('PeerSay')
    .directive('psInputNullable', psInputNullable);

function psInputNullable() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attr, ngModel) {
            var $td = $(element).parents('td');
            var $input = $(element);
            var unwatch = scope.$watch(function(){
                // this is the way to read $modelValue here, as far as initially it is set to NaN
                return ngModel.$modelValue;
            }, showNull);

            function showNull(value){
                unwatch();
                if (value == null) {
                    $td.addClass('null')
                        .click(clickHandler);
                }
            }

            function clickHandler() {
                $td.removeClass('null').off('click', clickHandler);
                $input.get(0).focus();
                scope.$evalAsync(init);
            }

            function init() {
                ngModel.$setViewValue(1);
                ngModel.$render();
            }

            // Clean-up
            element.on('$destroy', function () {
                $td.off('click', clickHandler);
            });
        }
    };
}