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
    m.getTotalSelected = getTotalSelected;
    // Table selection
    m.toggleGroup = toggleGroup;
    m.toggleReq = toggleReq;
    // Search selection
    m.requirement = {}; // ui-select model
    m.requirements = []; // ui-select list
    m.addNotFoundRequirement = addNotFoundRequirement;
    m.selectRequirement = selectRequirement;
    // Filters
    var filterExpr = {
        all: {removed: '!true'},
        selected: {selected: true, removed: '!true'},
        'not-selected': {selected: false, removed: '!true'}
    };
    m.filter = {
        name: 'all',
        expr: filterExpr.all
    };
    m.filterLiClass = filterLiClass;
    m.filterBtnClass = filterBtnClass;
    m.toggleFilter = toggleFilter;
    m.showFilteredGroup = showFilteredGroup;
    // Add/remove new
    var emptyNew = {
        name: '',
        topic: '',
        description: '',
        popularity: 100,
        selected: true,
        custom: true
    };
    m.addNew = {
        show: false,
        model: angular.copy(emptyNew),
        topic: {} // ui-select model
    };
    m.toggleAddNew = toggleAddNew;
    m.cancelAddNew = cancelAddNew;
    m.saveAddNew = saveAddNew;
    m.onSelectTopic = onSelectTopic;
    m.addNotFoundTopic = addNotFoundTopic;
    m.removeCustomReq = removeCustomReq;
    //Loading
    m.loadingMore = true;
    m.nextPage = 0;
    m.loadMore = loadMore;


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            m.groups.addItems(res.requirements, true); // reset
        });

        Projects.readPublicRequirements({page: m.nextPage}).then(function (res) {
            m.loadingMore = false;
            m.nextPage++;

            m.groups.addGroups(res.topics, true);
            m.groups.addItems(res.requirements, false, {selected: false});
            toggleAllGroupsByReqs();
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

    function loadMore() {
        m.loadingMore = true;
        Projects.readPublicRequirements({page: m.nextPage}).then(function (res) {
            m.loadingMore = false;
            m.nextPage++;

            m.groups.addItems(res.requirements, false, {selected: false});
            toggleAllGroupsByReqs();
        });

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

        toggleGroupByReqs(m.groups.get(req.topic));

        addRemoveLocal(req);
        patchProject();
    }

    function toggleGroup(group, invert) {
        var val = invert ? !group.selected : group.selected;
        toggleGroupByVal(group, val);
    }

    function toggleGroupByVal(group, val) {
        var on = group.selected = val;
        _.forEach(group.reqs, function (req) {
            req.selected = on;
            addRemoveLocal(req);
        });

        patchProject();
    }

    function toggleGroupByReqs(group) {
        var reqs = group.reqs;
        var len = reqs.length;
        var selectedLen = filterFilter(reqs, filterExpr.selected).length;

        group.selected = (selectedLen === len);
    }

    function toggleAllGroupsByReqs() {
        _.forEach(m.groups.list, function (group) {
            toggleGroupByReqs(group);
        });
    }

    function getTotalSelected() {
        return filterFilter(m.project.requirements, filterExpr.selected).length;
    }

    // Search Requirements
    //
    function addNotFoundRequirement(val) {
        m.addNew.show = true;
        m.addNew.model.name = val;

        var copy = angular.extend({}, emptyNew, m.addNew.model, {selected: false});
        return copy; // added to list!
    }

    function selectRequirement(req) {
        // Item without id is newly added, it should not be propagated to table/project
        if (!req.id) { return; }

        toggleReqVal(req, true);

        // TODO: focus (use ps-focus ?)
    }

    // Add/Remove new
    function toggleAddNew() {
        m.addNew.show = !m.addNew.show;
    }

    function cancelAddNew() {
        m.addNew.show = false;
        angular.extend(m.addNew.model, emptyNew);
    }

    function saveAddNew() {
        var req = angular.extend({}, emptyNew, m.addNew.model);
        req.topic = (m.addNew.topic.selected || {}).name || ''; // Empty topic is hidden in UI
        req.id = nextId(m.requirements);
        cancelAddNew();

        m.groups.addItems([req], true);

        addRemoveLocal(req); // always selected!
        patchProject();
    }

    function onSelectTopic(group) {
        if (group) {
            m.addNew.model.topic = group.name;
        }
    }

    function addNotFoundTopic(value) {
        return m.groups.create(value);
    }

    function removeCustomReq(req) {
        req.selected = false;
        req.removed = true; // trick: hide with filter

        addRemoveLocal(req, true/*force*/);
        patchProject();
    }

    function addRemoveLocal(req, forceRemove) {
        var localReqs = m.project.requirements;
        var localReq = _.findWhere(localReqs, {id: req.id});
        var localIdx = localReqs.indexOf(localReq);
        var inProject = (localIdx >= 0);

        if (req.selected) {
            if (!inProject) {
                localReqs.push(angular.copy(req)); // copy!

            } else if (localReq.custom) {
                localReq.selected = true;
            }
        }

        if (!req.selected && inProject) {
            if (!req.custom || forceRemove) {
                localReqs.splice(localIdx, 1); // remove if not user-added
            } else {
                localReq.selected = false;
            }
        }
    }

    // Grouping
    //
    function GroupBy(prop) {
        var G = {};
        G.list = [];
        G.get = getGroup;
        G.create = createNew;
        G.addGroups = addGroups;
        G.addItems = addItems;

        var groupIdx = {};
        var itemIdx = {};

        function getGroup(topic) {
            return groupIdx[topic];
        }

        function addGroups(groups, shared) {
            _.forEach(groups, function (it) {
                var group = groupIdx[it.name];
                if (!group) {
                    //console.log('>>Adding group new:', it.name);

                    // shared through Projects svc should be copied to prevent duplicates in reqs
                    // across Ctrl instantiations
                    group = shared ? angular.copy(it) : it;
                    group.reqs = group.reqs || [];
                    groupIdx[it.name] = group;
                    G.list.push(group);
                } else {
                    //console.log('>>Adding group exiting:', group.name);

                    // add props from global list missing in groups created from private items
                    angular.extend(group, it, {custom: false});
                }
            });
        }

        function createNew(name) {
            return {
                reqs: [],
                name: name,
                popularity: 100,
                selected: false,
                custom: true
            };
        }

        function addGroupByName(name) {
            var group = createNew(name);
            addGroups([group]);
            return group;
        }

        function addItems(list, local, extend) {
            _.forEach(list, function (it) {
                var publicNotSelected = !local && !itemIdx[it.id];
                var skipIt = !(local || publicNotSelected);

                if (skipIt) { return; }

                itemIdx[it.id] = true;

                // Add group
                var key = it[prop];
                var group = groupIdx[key];
                if (!group) {
                    group = addGroupByName(key);
                }

                // Need a copy to separate project's items which are observable
                var copy = angular.extend({}, it, extend);

                m.requirements.push(copy); // search list
                group.reqs.push(copy); // select table

                //console.log('>>Adding item to group[%s](%s): ', group.name, group.reqs.length, it.name);
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
