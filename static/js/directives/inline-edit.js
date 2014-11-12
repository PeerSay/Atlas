angular
    .module('peersay')
    .directive('psInlineEdit', psInlineEdit);

function psInlineEdit() {
    return {
        restrict: 'E',
        templateUrl: 'html/inline-edit.html',
        scope: {
            ctl: '=psControl',
            title: '@'
        },
        link: function (scope, element) {
            //console.log('>>>', scope.ctl);
            var parent = scope.$parent.cm;
            var $modal_el = $(element).parents('.modal');

            // Hide edit on dlg close
            $modal_el.on('hidden.bs.modal', hide);

            scope.ctl.toggleEdit = parent.toggleEditInline.bind(parent);
            scope.ctl.saveEdit = parent.saveEditInline.bind(parent);
            scope.ctl.displayValue = parent.displayValue.bind(parent);

            function hide() {
                scope.ctl.toggleEdit(scope.ctl, false);
            }
        }
    };
}