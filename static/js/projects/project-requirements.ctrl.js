angular.module('PeerSay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$state', '$stateParams', 'Projects', 'filterFilter', 'jsonpatch', 'Util'];
function ProjectRequirementsCtrl($scope, $state, $stateParams, Projects, filterFilter, jsonpatch, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.title = 'Requirements';
    m.onClose = onClose;
    m.goNext = goNext;
    m.goPrev = goPrev;
    // Data / Edit
    m.project = null; // ref to shared
    m.patchObserver = null;
    m.groups = GroupBy('topic');
    // Table selection
    m.requirement = {}; // ui-select model
    m.requirements = [];
    m.toggleGroup = toggleGroup;
    m.toggleReq = toggleReq;
    m.getTotalSelected = getTotalSelected;
    // Search selection
    m.addNotFoundRequirement = addNotFoundRequirement;
    m.selectRequirement = selectRequirement;
    // Filters
    var filterExpr = {
        all: {},
        selected: {selected: true},
        'not-selected': {selected: false}
    };
    m.filter = {
        name: 'all',
        expr: {}
    };
    m.filterLiClass = filterLiClass;
    m.filterBtnClass = filterBtnClass;
    m.toggleFilter = toggleFilter;
    m.showFilteredGroup = showFilteredGroup;
    // Add new
    var emptyNew = {
        name: '',
        topic: '',
        description: '',
        popularity: 100,
        selected: true,
        local: true
    };
    m.addNew = {
        show: false,
        requirement: angular.copy(emptyNew)
    };
    m.toggleAddNew = toggleAddNew;
    m.cancelAddNew = cancelAddNew;
    m.saveAddNew = saveAddNew;


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            m.groups.addItems(res.requirements, true); // reset
        });

        Projects.readPublicRequirements().then(function (res) {
            m.groups.addGroups(res.topics);
            m.groups.addItems(res.requirements);
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }


    // Filters
    //
    function filterLiClass(name) {
        return {active: m.filter.name === name};
    }

    function filterBtnClass() {
        return {
            'fa-minus-square-o': m.filter.name === 'all',
            'fa-check-square-o': m.filter.name === 'selected',
            'fa-square-o': m.filter.name === 'not-selected'
        };
    }

    function toggleFilter(name) {
        m.filter.name = name;
        m.filter.expr = filterExpr[name];
    }

    function showFilteredGroup(group) {
        var arr = filterFilter(group.reqs, m.filter.expr);
        return (arr.length !== 0);
    }

    // Selection
    //
    function toggleReq(req, invert) {
        var val = invert ? !req.selected : req.selected;
        toggleReqVal(req, val);
    }

    function toggleReqVal(req, val) {
        req.selected = val;

        toggleGroupByReq(req);

        addRemoveLocal(req);
        patchProject();
    }

    function toggleGroup(group) {
        var on = group.selected;
        _.forEach(group.reqs, function (req) {
            req.selected = on;
            addRemoveLocal(req);
        });

        patchProject();
    }

    function toggleGroupByReq(req) {
        var group = m.groups.get(req.topic);
        var reqs = group.reqs;
        var len = reqs.length;
        var selectedLen = 0;

        _.forEach(reqs, function (it) {
            if (it.selected) {
                selectedLen++;
            }
        });

        group.selected = (selectedLen === len);
    }

    function addRemoveLocal(req) {
        var localIdx = m.project.requirements.indexOf(req);
        var isAdded = (localIdx >= 0);

        if (req.selected) {
            if (!isAdded) {
                m.project.requirements.unshift(req); // add to local
            }
        }
        else {
            if (!req.local && isAdded) {
                // XXX - causes 'Object not found in root' exception in json-patch
                //m.project.requirements.splice(localIdx, 1); // remove from local
            }
        }
    }

    function getTotalSelected() {
        return filterFilter(m.project.requirements, filterExpr.selected).length;
    }

    // Search
    //
    function addNotFoundRequirement() {
        // TODO
    }

    function selectRequirement() {

    }

    // Add new
    function toggleAddNew() {
        m.addNew.show = !m.addNew.show;
    }

    function cancelAddNew() {
        m.addNew.show = false;
        angular.extend(m.addNew.req, emptyNew);
    }

    function saveAddNew() {
        var req = angular.extend({}, emptyNew, m.addNew.req);
        req.id = nextId(m.requirements);
        cancelAddNew();

        m.groups.addItems([req]);

        addRemoveLocal(req); // always selected!
        patchProject();
    }

    // Grouping
    //
    function GroupBy(prop) {
        var G = {};
        G.list = [];
        G.get = getGroup;
        G.addGroups = addGroups;
        G.addItems = addItems;

        var groupIdx = {};
        var itemIdx = {};

        function getGroup(topic) {
            return groupIdx[topic];
        }

        function addGroups(groups) {
            _.forEach(groups, function (it) {
                var group = groupIdx[it.name];
                if (group) {
                    // add props from global list missing in groups created from private items
                    angular.extend(group, it);
                } else {
                    it.reqs = it.reqs || [];
                    groupIdx[it.name] = it;
                    G.list.push(it);
                }
            });
        }

        function addItems(list, reset) {
            if (reset) {
                m.requirements = [];
                itemIdx = {};
            }

            _.forEach(list, function (it) {
                // Add to Search list - flat
                var skip = true;
                var publicNotSelected = !reset && !itemIdx[it.id];
                var privateSelected = reset && it.selected;
                if (privateSelected || publicNotSelected) {
                    it.selected = it.selected || false; // add missing prop to public list items
                    m.requirements.push(it);
                    skip = false;
                }
                itemIdx[it.id] = true;

                if (skip) { return; }

                // Add to group
                var key = it[prop];
                var group = groupIdx[key];
                if (!group) {
                    group = {
                        reqs: [],
                        name: key,
                        popularity: 100,
                        selected: false
                    };
                    addGroups([group]);
                }

                group.reqs.push(it);
            });
        }

        return G;
    }

    function nextId(arr) {
        var res = 0;
        _.forEach(arr, function (it) {
            res = Math.max(it.id, res) + 1;
        });
        return res;
    }


    function onClose() {
        $state.go('^');
    }

    function goNext() {
        $state.go('^.products');
    }

    function goPrev() {
        $state.go('^.essentials');
    }
}
