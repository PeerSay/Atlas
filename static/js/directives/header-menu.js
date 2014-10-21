angular
    .module('peersay')
    .directive('headerMenu', headerMenu);

function headerMenu() {
    return {
        restrict: 'A',
        link: link,
        controller: 'MainCtrl',
        controllerAs: 'pm'
    };

    function link(scope, $navbar) {
        var $auth_els = $navbar.find('.js-auth');
        var $app_els = $navbar.find('.js-app');
        var AUTH_RE = /(login|signup)/;

        scope.$watch('pm.activePage', function (value) {
            var activeLink = $navbar.find('.' + value);
            var activeClass = 'active';
            var is_auth = AUTH_RE.test(value);

            $navbar
                .find('.' + activeClass)
                .removeClass(activeClass);
            activeLink.addClass(activeClass);

            $auth_els.toggle(is_auth);
            $app_els.toggle(!is_auth);
        });
    }
}