angular
    .module('peersay')
    .directive('psTileControl', psTileControl);

function psTileControl() {
    return {
        restrict: 'E',
        templateUrl: 'html/tile-control.html',
        scope: {
            ctl: '=psControl',
            title: '@',
            toggleEdit: '@'
        },
        link: function (scope) {
            var ctl = scope.ctl;
            var parent = scope.$parent.cm;

            scope.displayValue = parent.displayValue.bind(parent);
            scope.showFullView = showFullView;

            function showFullView() {
                parent.showFullView(scope.toggleEdit || ctl.key);
            }
        }
    };
}