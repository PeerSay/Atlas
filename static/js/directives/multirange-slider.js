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
            m.handles = [];
            m.step = step(); //prop!
            m.pTotal = pTotal;
            m.updateRangeWidths = updateRangeWidths;
            m.elementWidth = elementWidth;

            function step() {
                if ($attrs.step) {
                    return parseFloat($parse($attrs.step)());
                } else {
                    return 0;
                }
            }

            function pTotal() {
                return m.ranges.reduce((function (sum, range) {
                    return sum + range.value();
                }), 0);
            }

            var clientWidth = 0;

            function updateRangeWidths() {
                clientWidth = $element.prop('clientWidth'); // why here?

                var runningTotal = 0;
                var total = m.pTotal();
                m.ranges.forEach(function (range) {
                    runningTotal += range.value();
                    range.update(runningTotal, total);
                });

                return m.handles.map(function (handle) {
                    return handle.updateWidth();
                });
            }

            function elementWidth() {
                var handlesWidth = m.handles.reduce(function (sum, handle) {
                    return sum + handle.width(); // XXX - outerWidth?
                }, 0);
                return clientWidth - handlesWidth;
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
                        widthAdjustment: '0px',
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
                        update: function (runningTotal, total) {
                            var x = runningTotal / total * 100;
                            var rangeWidth = this.value() / total * 99.9;
                            var width = rangeWidth * slider.elementWidth() / 100 > 1
                                ? "calc(" + rangeWidth + "% - " + this.widthAdjustment + ")"
                                : '0';

                            return element.css({
                                width: width,
                                'margin-left': this.widthAdjustment
                            });
                        },
                        adjustWidth: function (margin) {
                            return this.widthAdjustment = margin;
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
            var handle = {
                _width: 0,
                width: function () {
                    return this._width;
                },
                updateWidth: function () {
                    var nextRange = getNextRange();
                    this._width = element.prop('clientWidth');
                    element.css({
                        float: 'right',
                        marginRight: -handle.width() / 2 + 'px'
                    });
                    if (nextRange) {
                        nextRange.adjustWidth(handle.width() / 2 + 'px')
                    }
                }
            };

            slider.handles.push(handle);


            function getNextRange() {
                return slider.ranges[slider.ranges.indexOf(range) + 1];
            }

            // Dragging

            var startX = 0;
            var startPleft = 0;
            var startPright = 0;


            element.on("mousedown", function (event) {
                var nextRange = getNextRange();
                if (!nextRange) { return; } //TODO -  How possible?

                // Prevent default dragging of selected content
                event.preventDefault();

                startX = event.screenX;
                startPleft = range.value();
                startPright = nextRange.value();

                $document.on("mousemove", mousemove);
                $document.on("mouseup", mouseup);
            });

            function mousemove(event) {
                return scope.$apply(function () {
                    var dx = (event.screenX - startX) / slider.elementWidth() * slider.pTotal();
                    if (dx < -startPleft || dx > startPright) { return; }

                    range.value(startPleft + dx);
                    var nextRange = getNextRange();
                    if (nextRange) {
                        nextRange.value(startPright - dx);
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
