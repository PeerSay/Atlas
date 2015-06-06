angular
    .module('PeerSay')
    .directive('psDatePicker', psDatePicker);

// Requires: bootstrap3-datetimepicker (jQuery plugin)

psDatePicker.$inject = ['$timeout'];
function psDatePicker($timeout) {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ngModelCtrl) {
            var options = {
                format: 'DD/MM/YYYY',
                icons: {
                    date: 'fa fa-calendar',
                    next: 'fa fa-chevron-right',
                    previous: 'fa fa-chevron-left'
                },
                widgetPositioning: {
                    vertical: 'top'
                }
            };
            element
                .on('dp.change', function (e) {
                    $timeout(function () {
                        ngModelCtrl.$setViewValue(e.target.value);
                    });
                })
                .datetimepicker(options);

            // Show on addon click:
            $(element).next('.input-group-addon')
                .click(show);

            ngModelCtrl.$render = setValue;
            setValue();


            function setValue() {
                var date = ngModelCtrl.$viewValue || null;

                element
                    .data('DateTimePicker')
                    .date(date);
            }

            function show() {
                element
                    .data('DateTimePicker')
                    .show();
            }
        }
    };
}
