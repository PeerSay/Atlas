angular
    .module('PeerSay')
    .directive('psSliderPopover', psSliderPopover);

psSliderPopover.$inject = ['$compile', '$timeout'];
function psSliderPopover($compile, $timeout) {
    return {
        restrict: 'A',
        compile: function (tElement, tAttrs) {
            // Detaching form/slider from doc to prevent early compilation,
            // because it'd lead to slider malfunction after it moved in DOM later
            var $form = tElement.find('form').detach();

            return function postLink(scope, element, attrs, ctrls, transcludeFn) {
                var $toggler = element.find('a');
                var $container = element.parents(attrs.container);
                var isCompiled = false;

                $toggler.popover({
                    container: $container,
                    //viewport: $viewport,
                    //trigger: 'focus', // TODO
                    html: true,
                    content: function () {
                        // For proper work, slider el needs to be in proper place in DOM,
                        // so we first return detached el to be appended by popover plugin.
                        // then we compile/link this el.
                        if(!isCompiled) {
                            $timeout(function () {
                                $compile($form)(scope);
                                isCompiled = true;
                            });
                        }

                        return $form;
                    }
                });
            };
        }
    };
}