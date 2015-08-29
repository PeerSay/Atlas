angular
    .module('PeerSay')
    .directive('psSliderPopover', psSliderPopover);

psSliderPopover.$inject = ['$rootScope', '$compile', '$timeout'];
function psSliderPopover($rootScope, $compile, $timeout) {
    return {
        restrict: 'A',
        compile: function (tElement, tAttrs) {
            // Detaching form/slider from doc to prevent early compilation,
            // because it'd lead to slider malfunction after it moved in DOM later
            var $tplForm = tElement.find('form').detach();

            return function postLink(scope, element, attrs, ctrls, transcludeFn) {
                var id = attrs.uid;
                var $toggler = element.find('a');
                var $container = element.parents(attrs.container);
                var $form = $tplForm.clone();
                var isCompiled = false;

                //console.log('>>Slide id:', id);

                $toggler.popover({
                    container: $container,
                    //viewport: $viewport,
                    trigger: 'click',
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

                $toggler.on('shown.bs.popover', function () {
                    $('body').on('click', hide);
                });

                $toggler.on('hidden.bs.popover', function () {
                    $('body').off('click', hide);
                });

                $container.on('click', function () {
                    scope.$emit('hide.popover', id);
                });

                $rootScope.$on('hide.popover', function (evt, senderId) {
                    if (senderId !== id) {
                        hide();
                    }
                });

                function hide() {
                    $toggler.popover('hide');
                }
            };
        }
    };
}