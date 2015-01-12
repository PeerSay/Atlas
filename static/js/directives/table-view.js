angular
    .module('peersay')
    .directive('psTableView', psTableView);

psTableView.$inject = ['$timeout'];
function psTableView($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'html/table-view.html',
        scope: {
            view: '=psView'
        },
        link: function (scope, element, attrs, ctrls, transcludeFn) {
            var formModel = scope['form' + scope.view.name];

            scope.onKeydown = onKeydown;
            scope.onBlur = onBlur;

            function onKeydown(cell, evt) {
                var isTab = (evt.keyCode === 9) && !evt.shiftKey; // TAB w/o Shift
                if (isTab) {
                    if (scope.view.addRowOnTab(cell)) {
                        return evt.preventDefault();
                    }
                }
            }

            function onBlur(cell) {
                var input = formModel[cell.inputId];
                var modified = input.$dirty;
                if (modified) {
                    scope.view.saveCell(cell);
                    input.$setPristine();
                }
            }

            // Clean-up
            /*element.on('$destroy', function () {
             $el.off('show.bs.popover hide.bs.popover');
             });*/
        }
    };
}