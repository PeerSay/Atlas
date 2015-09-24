angular
    .module('PeerSay')
    .directive('psSliderPopover', psSliderPopover);

psSliderPopover.$inject = ['$rootScope', '$compile', '$parse', '$timeout'];
function psSliderPopover($rootScope, $compile, $parse, $timeout) {
    return {
        restrict: 'A',
        compile: function (tElement, tAttrs) {
            // Detaching form/slider from doc to prevent early compilation,
            // because it'd lead to slider malfunction after it moved in DOM later
            var $tplForm = tElement.find('form').detach();

            return function postLink(scope, element, attrs, ctrls, transcludeFn) {
                var $form = $tplForm.clone();
                var isCompiled = false;

                var uid = attrs.uid;
                var $toggler = element.find('a');
                var $container = attrs.container ? element.parents(attrs.container) : element;
                var trigger = attrs.trigger ? 'manual' : 'click';


                $toggler.popover({
                    container: $container,
                    //viewport: $viewport,
                    trigger: trigger,
                    html: true,
                    content: function () {
                        // For proper work, slider el needs to be in proper place in DOM when compiled,
                        // so we first return detached el to be appended by popover plugin,
                        // then we compile/link this el.
                        if (!isCompiled) {
                            $timeout(function () {
                                $compile($form)(scope);
                                isCompiled = true;
                            });
                        }

                        return $form;
                    }
                });

                if (attrs.trigger) {
                    scope.$watch(attrs.trigger, function (newVal, oldVal) {
                        //console.log('>> Watch:', newVal);
                        if (newVal) {
                            $toggler.popover('show');
                        }
                    });
                }

                $toggler.on('shown.bs.popover', function () {
                    $('body').on('click', hide);
                });

                $toggler.on('hidden.bs.popover', function () {
                    $('body').off('click', hide);
                });

                $container.on('click', function () {
                    scope.$emit('hide.popover', uid);
                });

                $rootScope.$on('hide.popover', function (evt, senderUid) {
                    if (senderUid !== uid) {
                        hide();
                    }
                });

                function hide() {
                    $toggler.popover('hide');
                    if (attrs.trigger) {
                        scope.$apply(function () {
                            $parse(attrs.trigger).assign(scope, false);
                        });
                    }
                }
            };
        }
    };
}
