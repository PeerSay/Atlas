angular
    .module('peersay')
    .directive('psHeaderMenu', headerMenu);

function headerMenu() {
    return {
        restrict: 'A',
        link: link,
        controller: 'MenuCtrl',
        controllerAs: 'm'
    };

    function link(scope, $navbar) {
        var $auth_els = $navbar.find('.js-auth');
        var $app_els = $navbar.find('.js-app');
        var AUTH_RE = /^auth/;

        scope.$watch('m.activePage.name', function (value) {
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