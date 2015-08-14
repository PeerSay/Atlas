angular.module('PeerSay')
    .factory('CategorySelect', CategorySelect);


CategorySelect.$inject = ['$rootScope', 'Util'];
function CategorySelect($rootScope, _) {
    var C = {};
    // View model for ui-select
    C.vm = {
        list: [],
        model: {}, // of ui-select
        select: select,
        groupBy: groupBy,
        add: add,
        remove: remove
    };
    //For the outer world
    C.init = init;
    C.load = load;
    C.reset = reset;
    C.on = on;

    function load(items, options) {
        var top = options && options.top;
        C.vm.list = top ?
            [].concat(items, C.vm.list) :
            [].concat(C.vm.list, items);
    }

    function reset() {
        C.vm.list = [];
        C.vm.model = {};
    }

    function init(val) {
        C.vm.model.selected = {name: val};
    }

    function getSelected() {
        return (C.vm.model.selected || {}).name || '';
    }

    function select($model) {
        $rootScope.$emit('category.select', 'select', $model.name);
    }

    function on(fn) {
        return $rootScope.$on('category.select', fn);
    }

    function groupBy(item) {
        return item.domain || '';
    }

    function add(val) {
        var exist = _.findWhere(C.vm.list, {name: val});
        if (exist) { return; }

        var item = {
            name: val,
            domain: '',
            custom: true
        };
        C.vm.list.unshift(item);

        $rootScope.$emit('category.select', 'add', item);

        return item; // add to list
    }

    function remove(item) {
        _.removeItem(C.vm.list, item);

        var isCurrent = (item.name === getSelected());
        if (isCurrent) {
            C.vm.model = {};
        }

        $rootScope.$emit('category.select', 'remove', item.name, isCurrent);
    }

    return C;
}