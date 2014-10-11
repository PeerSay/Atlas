angular
    .module('peersay')
    .directive('headerMenu', headerMenu);

function headerMenu() {
    return {
        restrict: 'A',
        link: link,
        controller: 'Main',
        controllerAs: 'pm'
    };

    function link(scope, $elem) {
        var $auth_els = $elem.find('.auth');
        var $db_els = $elem.find('.dashboard');

        scope.$watch('pm.activePage', function (value) {
            var activeLink = $elem.find('.' + value);
            var activeClass = 'active';
            var is_auth = (value !== 'dashboard');

            $elem
                .find('.' + activeClass)
                .removeClass(activeClass);
            activeLink.addClass(activeClass);

            $auth_els.toggle(is_auth);
            $db_els.toggle(!is_auth);
        });
    }
}