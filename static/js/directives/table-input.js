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
            var productCells = function () {
                var $cells = $('#decision-table th, #decision-table td');
                // using jquery.column.js plugin
                var $inputCol = $cells.nthCol($td.index());
                var $gradeCol = $cells.nthCol($td.index() + 1);
                return $inputCol.add($gradeCol);
            };

            var ctrl = scope.$eval(attrs.ctrl);
            var cell = scope.$eval(attrs.psTableInput);
            var model = cell.model;

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
                    if (model.save()) {
                        ctrl.patchProject();
                    }
                });
            });

            // Mute zero-weight rows
            if (cell.model.muteRow) {
                scope.$watch(cell.model.muteRow, function (newVal/*, oldVal*/) {
                    $tr.toggleClass('muted', newVal);
                });
            }

            //Mute columns if mandatory requirement is not met
            if (cell.model.muteProd) {
                scope.$watch(cell.model.muteProd, function (newVal/*, oldVal*/) {
                    $td.toggleClass('culprit', newVal);

                    var $prodCells = productCells();
                    var anyMuted = ($prodCells.filter('.culprit').length > 0);
                    $prodCells.toggleClass('muted', anyMuted);
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