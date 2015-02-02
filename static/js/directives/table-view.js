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

            scope.onCellKeydown = onCellKeydown;
            scope.onCellFocus = onCellFocus;
            scope.onCellBlur = onCellBlur;
            scope.onColKeydown = onColKeydown;
            scope.onColBlur = onColBlur;
            scope.getInput = getInput;

            function getInput(colOrCell) {
                return formModel[colOrCell.id]
            }

            function onCellKeydown(cell, evt) {
                var isTab = (evt.keyCode === 9) && !evt.shiftKey; // TAB w/o Shift
                if (isTab) {
                    if (scope.view.addRowOnTab(cell)) {
                        return evt.preventDefault();
                    }
                }
            }

            function onCellFocus(cell) {
                cell.edited = true;
            }

            function onCellBlur(cell) {
                cell.edited = false;

                var input = getInput(cell);
                var modified = input.$dirty;
                if (modified) {
                    scope.view.saveCell(cell.model);
                    input.$setPristine();
                }
            }

            function onColKeydown(col, evt) {
                var isEnter = (evt.keyCode === 13);
                var isEsc = (evt.keyCode === 27); // TODO - discard
                var el = evt.target;

                if (isEnter || isEsc) {
                    $timeout(function () {
                        el.blur(); // blur leads to column save
                    }, 0, false);
                }
            }

            function onColBlur(col) {
                col.edited = false;

                var input = getInput(col);
                var invalid = input.$invalid;
                var modified = input.$dirty;

                if (invalid) {
                    // return old value;
                    col.model.value = !col.last ? col.model.field : '';
                    input.$setPristine();
                } else if (modified) {
                    scope.view.saveColumnCell(col.model);
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