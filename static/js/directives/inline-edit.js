angular
    .module('peersay')
    .directive('psInlineEdit', psInlineEdit);

function psInlineEdit() {
    return {
        restrict: 'E',
        templateUrl: 'html/inline-edit.html',
        scope: {
            ctl: '=psControl',
            title: '@',
            type: '@'
        },
        link: function (scope, element) {
            //console.log('>>>', scope.ctl);
            var parent = scope.$parent.cm;

            $(function () {
                var $modal_el = $(element).parents('.modal');
                $modal_el
                    .on('hidden.bs.modal', onHide)
                    .on('shown.bs.modal', onShow);
            });

            scope.ctl.toggleEdit = parent.toggleEditInline.bind(parent);
            scope.ctl.saveEdit = parent.saveEditInline.bind(parent);
            scope.ctl.displayValue = parent.displayValue.bind(parent);

            function onHide() {
                // Hide edit on dlg close
                scope.ctl.toggleEdit(scope.ctl, false);
            }

            function onShow() {
                if (scope.type === 'date') {
                    var $el = element.find('.js-date')
                        .datetimepicker()
                        .on('dp.change', function (e) {
                            scope.$apply(function () {
                                scope.ctl.editValue = e.date._d; // XXX: internal?
                            });
                        });

                    // init
                    var date = new Date(scope.ctl.value);
                    $el.data("DateTimePicker").setDate(date);
                }
            }
        }
    };
}