angular
    .module('peersay')
    .directive('psTableView', psTableView);

psTableView.$inject = ['$timeout'];
function psTableView($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'html/table-view.html',
        //replace: true,
        scope: {
            view: '=psView'
        },
        link: function (scope, element, attrs, ctrls, transcludeFn) {
            // Clean-up
            /*element.on('$destroy', function () {
                $el.off('show.bs.popover hide.bs.popover');
            });*/
        }
    };
}