angular
    .module('PeerSay')
    .directive('psTableInput', psTableInput);

function psTableInput() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            var $el = $(element);
            var $td = $el.parents('td');
            var $tr = $td.parent();
            var $tbody = $td.parents('tbody');
            var allProductCells = function () {
                var $cells = $('#decision-table th, #decision-table td');
                // using jquery.column.js plugin
                var $inputCol = $cells.nthCol($td.index());
                var $gradeCol = $cells.nthCol($td.index() + 1);
                return $inputCol.add($gradeCol);
            };
            var allGroupGradeCells = function () {
                var $cells = $tbody.find('td');
                return $cells.nthCol($td.index() + 1);
            };

            var ctrl = scope.$eval(attrs.ctrl);
            var cell = scope.$eval(attrs.psTableInput);

            // Make active on clicking cell outside input (if cell is larger)
            $td.click(function () {
                $el.focus();
            });

            // Toggle 'edit' class on focus/blur
            $el.on('focus', function () {
                $td.addClass('edited');
            });

            // Save model
            $el.on('blur', function () {
                $td.removeClass('edited');
                scope.$apply(function () {
                    if (cell.model.save()) {
                        ctrl.patchProject();
                    }
                });
            });

            // Mute zero-weight rows
            if (cell.muteRow) {
                scope.$watch(cell.muteRow, function (newVal/*, oldVal*/) {
                    $tr.toggleClass('muted', newVal);
                });
            }

            //Mute columns if mandatory requirement is not met
            if (cell.muteProd) {
                scope.$watch(cell.muteProd, function (newVal/*, oldVal*/) {
                    // red-triangle class on cell
                    $td.toggleClass('culprit', newVal);

                    // mute 2 columns
                    var $prodCells = allProductCells();
                    var anyMuted = ($prodCells.filter('.culprit').length > 0);
                    $prodCells.toggleClass('muted', anyMuted);

                    // red-triangle class on group cell
                    var $groupCells = allGroupGradeCells();
                    var anyMutedInGroup = ($groupCells.slice(1).filter('.culprit').length > 0);
                    $groupCells.first().toggleClass('group-culprit', anyMutedInGroup);
                });
            }

            // Show invalid input (numbers only) by applying class on parent
            if (cell.type === 'number') {
                scope.$watch(function () {
                    return ngModel.$invalid;
                }, function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        $td.toggleClass('invalid', newVal);
                    }
                });
            }
        }
    };
}