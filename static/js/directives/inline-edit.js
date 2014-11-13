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
            var parent = scope.$parent.cm;
            var ctl = scope.ctl;
            var $modal_el = $(element).parents('.modal');

            $modal_el
                .on('shown.bs.modal', onShow);

            ctl.toggleEdit = parent.toggleEditInline.bind(parent);
            ctl.saveEdit = parent.saveEditInline.bind(parent);
            ctl.displayValue = parent.displayValue.bind(parent);

            scope.$watch('toggle.control', function (newVal) {
                //console.log('>>Event for uri change', newVal);

                var on = (ctl.key === newVal);
                toggle(on);
            }, true);

            function toggle(on) {
                ctl.editValue = on ? ctl.value: '';
                ctl.edit = on;
            }

            function onShow() {
                if (scope.type === 'date') {
                    var $el = element.find('.js-date')
                        .datetimepicker()
                        .on('dp.change', function (e) {
                            scope.$apply(function () {
                                ctl.editValue = e.date._d; // XXX: internal?
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