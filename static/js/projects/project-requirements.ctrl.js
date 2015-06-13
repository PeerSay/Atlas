angular.module('PeerSay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'filterFilter', 'jsonpatch', 'Util'];
function ProjectRequirementsCtrl($scope, $stateParams, Projects, filterFilter, jsonpatch, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    // Data / Edit
    m.project = null; // ref to shared
    m.patchObserver = null;
    m.groups = GroupBy('topic');
    //Loading
    var QUERY_LIMIT = 10;
    var loadFrom = 0;
    var noLoadMore = false;
    m.loadingMore = true;
    m.loadMore = loadMore;
    m.showLoadMoreBtn = showLoadMoreBtn;
    // Table selection
    m.toggleGroup = toggleGroup;
    m.toggleReq = toggleReq;
    m.getTotalSelected = getTotalSelected;
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
    m.isEmptyTable = isEmptyTable;
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


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            m.groups.addItems(res.requirements, true); // reset

            // Public topics & reqs
            Projects.readPublicTopics().then(function (res) {
                m.groups.addGroups(res.topics, true);

                loadPublicItems({from: loadFrom, limit: QUERY_LIMIT});
            });
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; } // XXX -can return non-promise

        return Projects.patchProject(m.projectId, patch);
    }

    function loadPublicItems(params) {
        m.loadingMore = true;
        return Projects.readPublicRequirements(params)
            .then(function (res) {
                var len = res.requirements.length;
                var lastBatch = (len < QUERY_LIMIT);
                if (len) {
                    loadFrom += res.requirements.length;
                    m.groups.addItems(res.requirements, false, {selected: false});

                    toggleAllGroupsByReqs();
                }
                if (lastBatch) {
                    noLoadMore = true;
                }
            })
            .finally(function () {
                m.loadingMore = false;
            });
    }

    function loadMore() {
        loadPublicItems({from: loadFrom, limit: QUERY_LIMIT});
    }

    function showLoadMoreBtn() {
        var hide = noLoadMore ||
            (m.filter.name === 'selected'); // always empty for selected filter
        return !hide;
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

    function isEmptyTable() {
        var res = false;
        var i = 0, group;
        while (group = m.groups.list[i]) {
            if (res = showFilteredGroup(group)) { break; }
            i++;
        }
        return !res;
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
        if (!req._id) { return; }

        toggleReqVal(req, true);
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
        cancelAddNew();

        addRemoveLocal(req); // always selected!
        patchProject().then(function (res) {
            // XXX - patch may return non-promise
            req._id = res._id; //get id from server response
            m.groups.addItems([req], true);
        });
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

        // Todo: remove from groups

        addRemoveLocal(req, true/*force*/);
        patchProject();
    }

    function addRemoveLocal(req, forceRemove) {
        var localReqs = m.project.requirements;
        var localReq = _.findWhere(localReqs, {_id: req._id});
        var localIdx = localReqs.indexOf(localReq);
        var inProject = (localIdx >= 0);

        //add
        if (req.selected) {
            if (inProject && localReq.custom) {
                localReq.selected = true;
            } else if (!inProject) {
                localReqs.push(req.custom ? req : angular.copy(req)); // copy if not custom
            }
        }

        //remove
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
                var publicNotSelected = !local && !itemIdx[it._id];
                var skipIt = !(local || publicNotSelected);

                if (skipIt) { return; }

                itemIdx[it._id] = true;

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
}
