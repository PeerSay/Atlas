angular.module("PeerSay")
    .directive("slider", sliderDirective)
    .directive("sliderRange", sliderRangeDirective)
    .directive('sliderHandle', sliderHandleDirective);


sliderDirective.$inject = ['$parse'];
function sliderDirective($parse) {
    return {
        restrict: "E",
        replace: true,
        transclude: true,
        template:
        '<div class="ps-multirange-slider">' +
            '<div class="slider" ng-transclude></div>' +
        '</div>',
        link: function (scope, element, attrs, ctrl) {
            return element.children().css('position', 'relative');
        },
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
            var m = this;
            m.ranges = [];
            m.step = step(); //prop!
            m.modelTotal = modelTotal;
            m.updateRangeWidths = updateRangeWidths;
            m.elementWidth = elementWidth;

            function step() {
                if ($attrs.step) {
                    return parseFloat($parse($attrs.step)());
                } else {
                    return 0;
                }
            }

            function modelTotal() {
                return m.ranges.reduce(function (sum, range) {
                    return sum + range.value();
                }, 0);
            }

            function updateRangeWidths() {
                var total = m.modelTotal();
                m.ranges.forEach(function (range) {
                    range.update(total);
                });
            }

            function elementWidth() {
                return $element.prop('clientWidth');
            }
        }]
    };
}


sliderRangeDirective.$inject = ['$parse'];
function sliderRangeDirective($parse) {
    return {
        restrict: 'E',
        template: '<div class="slider-range" ng-transclude></div>',
        require: ['^slider', 'sliderRange'],
        replace: true,
        transclude: true,
        controller: function () {
            return {}; // populated in preLink
        },
        compile: function () {
            return {
                pre: function (scope, element, attrs, ctrls) {
                    var slider = ctrls[0],
                        range = ctrls[1];
                    var valueFn = $parse(attrs.model);

                    slider.ranges.push(range);

                    scope.$watch(attrs.model, function () {
                        return slider.updateRangeWidths();
                    });

                    return angular.extend(range, {
                        value: function (val) {
                            var s = slider.step;
                            if (val == null) {
                                return parseFloat('' + valueFn(scope, {}), 10);
                            }
                            if (s > 0) {
                                val = Math.round(val / s) * s;
                            }
                            return valueFn.assign(scope, val);
                        },
                        update: function (total) {
                            var rangePercent = this.value() / total * 100;
                            var width = rangePercent + '%';
                            element.css({width: width});
                        }
                    });
                },
                post: function (scope, element, attrs, ctrls) {
                    var slider = ctrls[0], range = ctrls[1];

                    element.on('$destroy', function () {
                        slider.ranges.splice(slider.ranges.indexOf(range), 1);
                        slider.updateRangeWidths();
                    });
                }
            };
        }
    };
}

sliderHandleDirective.$inject = ['$document'];
function sliderHandleDirective($document) {
    return {
        restrict: 'AC',
        replace: false,
        require: ['^slider', '^sliderRange'],
        link: function (scope, element, attrs, ctrls) {
            var slider = ctrls[0],
                range = ctrls[1];

            function getNextRange() {
                return slider.ranges[slider.ranges.indexOf(range) + 1];
            }

            // Dragging

            var startX = 0;
            var startModelLeft = 0;
            var startModelRight = 0;

            element.on("mousedown", function (event) {
                var nextRange = getNextRange();
                // Practically impossible due to styles, just in case
                if (!nextRange) { return; }

                // Prevent default dragging of selected content
                event.preventDefault();

                startX = event.screenX;
                startModelLeft = range.value();
                startModelRight = nextRange.value();

                $document.on("mousemove", mousemove);
                $document.on("mouseup", mouseup);
            });

            function mousemove(event) {
                return scope.$apply(function () {
                    var dx = event.screenX - startX;
                    var modelDx = dx / slider.elementWidth() * slider.modelTotal();
                    if (modelDx < -startModelLeft || modelDx > startModelRight) {
                        // Prevent negative values & range overlaps
                        return;
                    }

                    range.value(startModelLeft + modelDx);
                    var nextRange = getNextRange();
                    if (nextRange) {
                        nextRange.value(startModelRight - modelDx);
                    }

                    slider.updateRangeWidths();
                });
            }

            function mouseup() {
                $document.off("mousemove", mousemove);
                $document.off("mouseup", mouseup);
            }
        }
    };
}
