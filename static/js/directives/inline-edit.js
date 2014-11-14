angular
    .module('peersay')
    .directive('psInlineEdit', psInlineEdit);

function psInlineEdit() {
    return {
        restrict: 'E',
        templateUrl: 'html/inline-edit.html',
        scope: {
            toggle: '=psToggle',
            ctl: '=psControl',
            title: '@',
            type: '@'
        },
        link: function (scope, element) {
            var ctl = scope.ctl;
            var parent = scope.$parent.cm;
            var $modal_el = $(element).parents('.modal');

            scope.edit = {
                value: '',
                show: false
            };
            scope.toggleEdit = parent.toggleEditInline.bind(parent);
            scope.saveEdit = parent.saveEditInline.bind(parent);
            scope.displayValue = parent.displayValue.bind(parent);

            scope.$watch('toggle.control', function (newVal) {
                toggle(ctl.key === newVal);
            });

            $modal_el
                .on('shown.bs.modal', onShow);

            function toggle(on) {
                scope.edit.value = on ? ctl.value: '';
                scope.edit.show = on;
            }

            function onShow() {
                if (scope.type === 'date') {
                    var $el = element.find('.js-date')
                        .datetimepicker()
                        .on('dp.change', function (e) {
                            scope.$apply(function () {
                                scope.edit.value = e.date._d; // XXX: internal?
                            });
                        });

                    // init
                    var date = new Date(ctl.value);
                    $el.data("DateTimePicker").setDate(date);
                }
            }
        }
    };
}