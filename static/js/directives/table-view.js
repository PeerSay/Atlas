angular
    .module('peersay')
    .directive('psTableView', psTableView);

psTableView.$inject = ['$timeout', 'Util'];
function psTableView($timeout, _) {
    return {
        restrict: 'E',
        templateUrl: 'html/table-view.html',
        scope: {
            view: '=psView'
        },
        link: function (scope) {
            var view = scope.view;
            var formModel = scope['form' + view.name];

            scope.onCellKeydown = onCellKeydown;
            scope.onCellFocus = onCellFocus;
            scope.onCellBlur = onCellBlur;
            scope.onColKeydown = onColKeydown;
            scope.onColBlur = onColBlur;
            scope.getInput = getInput;

            /*if (view.watched) {
                scope.$watch(function () {
                    // TODO perf - less impact
                    return view.watcher && view.watcher.digest();
                }, function (newObj, oldObj) {
                    //console.log('>> Watch changed: old=%s, new=%s', oldObj, newObj);

                    _.forEach(view.columns, function (col) {
                        if (col.footer) {
                            //console.log('>> Applying for each col key:', col.footer.key);
                            view.watcher.apply(col.footer, newObj.key);
                        }
                    });
                }, true);
            }*/

            function getInput(colOrCell) {
                return formModel[colOrCell.id]
            }

            function onCellKeydown(cell, evt) {
                var isTab = (evt.keyCode === 9) && !evt.shiftKey; // TAB w/o Shift
                if (isTab) {
                    if (view.addRowOnTab(cell)) {
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
                    view.saveCell(cell.model);
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
                    view.saveColumnCell(col);
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