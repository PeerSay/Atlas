angular.module('PeerSay')
    .controller('ProjectRequirementsCtrl', ProjectRequirementsCtrl);

ProjectRequirementsCtrl.$inject = ['$scope', '$stateParams', '$timeout', 'Projects', 'filterFilter', 'jsonpatch', 'Util'];
function ProjectRequirementsCtrl($scope, $stateParams, $timeout, Projects, filterFilter, jsonpatch, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    // Data / Edit
    m.project = null; // ref to shared
    m.patchObserver = null;
    m.loadingMore = true;
    m.groups = GroupBy('topic');
    // Table selection
    m.toggleReq = toggleReq;
    // Search selection
    m.search = Search();
    //Filter
    m.filter = {
        visible: {removed: '!true'},
        selected: {selected: true, removed: '!true'}
    };
    // Edit/add new
    m.edit = Edit();
    // Remove
    m.removeLocalReq = removeLocalReq; //TODO - unselect if not-custom


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

    // Selection
    //
    function toggleReq(req, invert) {
        var val = invert ? !req.selected : req.selected;
        toggleReqVal(req, val);
    }

    function toggleReqVal(req, val) {
        req.selected = req.focus = val; //set focus on selected

        addRemoveLocal(req);
        patchProject();
    }

    // Search
    //
    function Search() {
        var S = {};
        S.model = {};
        S.list = [];
        S.add = add;
        S.onSelect = select;
        S.onAddNew = addNew;

        function add(req) {
            S.list.push(req);
        }

        function select(req) {
            // Item without id is newly added, it should not be propagated to table/project
            if (!req._id) { return; }

            toggleReqVal(req, true);
            m.groups.revealItem(req);
        }

        function addNew(value) {
            var newReq = m.edit.initWithVal(value);
            // need to return new item to hide search list
            return newReq;
        }

        return S;
    }

    // Edit / add new
    //
    function Edit() {
        var E = {};
        var emptyNew = {
            name: '',
            topic: '',
            description: '',
            popularity: 100,
            selected: false,
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
        E.toggleNew = toggleNew;
        E.init = init;
        E.initWithVal = initWithVal;
        E.cancel = cancel;
        E.save = save;

        var curReq = null;

        function toggleNew() {
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

        function initWithVal(value) {
            var newReq = angular.extend({}, emptyNew, {name: value, selected: false});
            angular.extend(E.model, pick(newReq));

            toggle(true);
            return newReq;
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
                req = angular.extend({}, emptyNew, E.model, {selected: true});
                addRemoveLocal(req);
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
        G.revealItem = revealItem;
        G.isVisible = isVisible;

        var groupIdx = {};
        var itemIdx = {};
        var nextId = nextIdFn();

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
                    group.id = nextId();
                    group.paging = Paging(group);
                    group.sel = Selected(group);

                    groupIdx[it.name] = group;
                    G.list.push(group);
                } else {
                    //console.log('>>Adding group exiting:', group.name);

                    // add props from global list missing in groups created from private items
                    angular.extend(group, it, {custom: false});
                }
            });
        }

        function nextIdFn() {
            var id = 0;
            return function () {
                return 'group-' + (id++);
            };
        }

        function createNew(name) {
            return {
                reqs: [],
                name: name,
                popularity: 100,
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

                m.search.add(copy); // search list
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

        function revealItem(req) {
            // Reveal if hidden by accordion/paging & focus it
            var group = getGroup(req.topic);
            group.paging.revealItem(req);

            group.open = true; // triggers accordion open
        }

        function isVisible(group) {
            var arr = filterFilter(group.reqs, m.filter.visible);
            return (arr.length !== 0);
        }

        //Selected
        function Selected(group) {
            var S = {};
            S.number = function () {
                return filterFilter(group.reqs, m.filter.selected).length;
            };
            return S;
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
            return m.loadingMore || group.custom || group.reqs.length <= MIN;
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
