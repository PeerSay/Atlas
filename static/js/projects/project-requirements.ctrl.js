angular.module('PeerSay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$stateParams', '$timeout', 'Projects', 'filterFilter', 'jsonpatch', 'Util'];
function ProjectRequirementsCtrl($scope, $stateParams, $timeout, Projects, filterFilter, jsonpatch, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    // Data / Edit
    m.project = null; // ref to shared
    m.patchObserver = null;
    m.groups = GroupBy('topic');
    //Loading
    m.loadingMore = true;
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
    // Edit/add new
    m.edit = Edit();
    // Remove
    m.removeLocalReq = removeLocalReq; //TODO - unselect if not-custom
    //Full screen
    m.fullscreen = {
        on: false,
        toggle: function () {
            this.on = !this.on;
        }
    };


    activate();

    function activate() {
        Projects.readProject(m.projectId).then(function (res) {
            m.project = res;
            m.patchObserver = jsonpatch.observe(m.project);

            m.groups.addItems(res.requirements, true); // reset

            // Public topics & reqs
            Projects.readPublicTopics().then(function (res) {
                m.groups.addGroups(res.topics, true);

                // Loading all items!
                return Projects.readPublicRequirements(/*no params*/)
                    .then(function (res) {
                        m.groups.addItems(res.requirements, false, {selected: false});

                        toggleAllGroupsByReqs();
                    })
                    .finally(function () {
                        m.loadingMore = false;
                    });
            });
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });
    }

    function patchProject() {
        var nullPromise = $timeout(function () {
        });
        var patch = jsonpatch.generate(m.patchObserver);
        patch = fixPatch(patch);
        if (!patch.length) { return nullPromise; }

        return Projects.patchProject(m.projectId, patch);
    }

    function fixPatch(arr) {
        // XXX - workaround for wrong patches generated on unselecting group
        // Not clear why this happens, but it depends on the order items were added.
        // TODO - debug further.
        return _.map(arr, function (it) {
            if (it.op === 'replace' && !angular.isDefined(it.value)) {
                return null;
            }
            return it;
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

        // Reveal if hidden by paging
        var group = m.groups.get(req.topic);
        group.paging.revealItem(req);
    }

    // Add/Remove new
    function Edit() {
        var E = {};
        var emptyNew = {
            name: '',
            topic: '',
            description: '',
            popularity: 100,
            selected: true,
            custom: true,
            mandatory: false
        };

        E.model = pick(emptyNew);
        E.topic = { // ui-select model
            selected: {},
            value: function () {
                return (this.selected || {}).name || ''
            },
            onSelect: function (m) {
                if (m) {
                    E.model.topic = m.name;
                }
            },
            onAddNew: function (value) {
                return m.groups.create(value);
            }
        };
        E.visible = false;
        E.toggleByBtn = toggleByBtn;
        E.init = init;
        E.cancel = cancel;
        E.save = save;

        var curReq = null;

        function toggleByBtn() {
            if (E.visible) {
                cancel();
            } else {
                toggle();
            }
        }

        function toggle(show) {
            E.visible = (arguments.length > 0) ? show : !E.visible;
        }

        function init(req) {
            curReq = req;
            angular.extend(E.model, pick(req));
            E.topic.selected = {name: req.topic};

            toggle(true);
        }

        function cancel() {
            toggle(false);
            angular.extend(E.model, pick(emptyNew));
            E.topic.selected = {};
            curReq = null;
        }

        function save() {
            updateProject(!curReq);
            updateList();
            cancel();
        }

        function updateProject(isNew) {
            var req = null;
            if (isNew) {
                req = angular.extend({}, emptyNew, E.model);
                addRemoveLocal(req); // always selected!
            } else {
                req = _.findWhere(m.project.requirements, {_id: curReq._id});
                angular.extend(req, E.model);
            }

            patchProject().then(function (res) {
                if (isNew && res) {
                    req._id = res._id; //get id from server response
                    m.groups.addItems([req], true);
                }
            });
        }

        function updateList() {
            if (!curReq) { return; }

            var oldTopic = curReq.topic;
            angular.extend(curReq, E.model);
            m.groups.relocate(curReq, oldTopic, curReq.topic);

            toggleGroupByReqs(m.groups.get(curReq.topic));
        }

        function pick(obj) {
            return {
                name: obj.name,
                description: obj.description,
                topic: obj.topic,
                mandatory: !!obj.mandatory
            };
        }

        return E;
    }

    function removeLocalReq(req) {
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
                //console.log('>>Add: select local idx=%s', localIdx);
                localReq.selected = true;
            } else if (!inProject) {
                //console.log('>>Add: push local copy?=%s', !req.custom);
                localReqs.push(req.custom ? req : angular.copy(req)); // copy if not custom
            }
        }

        //remove
        if (!req.selected && inProject) {
            if (!req.custom || forceRemove) {
                //console.log('>>>>Remove: splice local idx=%s', localIdx);
                localReqs.splice(localIdx, 1); // remove if not user-added
            } else {
                //console.log('>>>>Remove: unselect local idx=%s', localIdx);
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
        G.relocate = relocate;

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
                    group.paging = Paging(group);

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


        function relocate(req, oldName, name) {
            if (oldName === name) { return; }

            var oldGroup = getGroup(oldName);
            var oldIdx = oldGroup.reqs.indexOf(req);
            if (oldIdx >= 0) {
                oldGroup.reqs.splice(oldIdx, 1);
            }

            var group = getGroup(name);
            if (!group) {
                group = addGroupByName(name);
            }
            group.reqs.push(req);
        }

        return G;
    }

    // Paging
    //
    function Paging(group) {
        var P = {};
        var MIN = 3;
        var STEP = 3;
        P.limit = MIN;
        P.disabled = disabled;
        P.showMore = showFn(STEP);
        P.showLess = showFn(-STEP);
        P.disableShowLess = true;
        P.disableShowMore = false;
        P.hiddenItems = hiddenItems;
        P.revealItem = revealItem;

        function showFn(diff) {
            return function () {
                var max = group.reqs.length;

                P.limit += diff;
                P.disableShowLess = P.disableShowMore = false;

                if (P.limit <= MIN) {
                    P.disableShowLess = true;
                    P.limit = MIN;
                } else if (P.limit >= max) {
                    P.disableShowMore = true;
                    P.limit = max;
                }
            }
        }

        function disabled() {
            return m.loadingMore || m.filter.name !== 'all' || group.custom || group.reqs.length <= MIN;
        }

        function hiddenItems() {
            return group.reqs.length - P.limit;
        }

        function revealItem(req) {
            var reqIdx = group.reqs.indexOf(req);
            var diff = reqIdx - P.limit + 1;

            if (diff > 0) {
                showFn(diff)();
            }
        }

        return P;
    }
}
