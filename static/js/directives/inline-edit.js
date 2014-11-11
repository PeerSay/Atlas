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
        link: function (scope) {
            console.log('>>>', scope.ctl);
            var parent = scope.$parent.cm;

            if (scope.ctl) {
                scope.ctl.toggleEdit = parent.toggleEditInline.bind(parent);
                scope.ctl.saveEdit = parent.saveEditInline.bind(parent);
                scope.ctl.displayValue = parent.displayValue.bind(parent);
            }
        }
    };
}