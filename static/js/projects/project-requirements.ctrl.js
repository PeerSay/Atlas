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
    m.editFactory = EditFactory();
    m.editNew = m.editFactory.create({'class': 'add-new'});
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
            var newReq = m.editNew.show({name: value});
            // need to return new item to hide search list
            return newReq;
        }

        return S;
    }

    // Edit factory
    //
    function EditFactory() {
        var F = {};
        F.create = create;

        var emptyNew = {
            name: '',
            topic: '',
            description: '',
            popularity: 100,
            selected: false,
            custom: true,
            mandatory: false
        };
        var curEdit = null;

        function create(spec) {
            return EditOne(spec);
        }

        function hideCur(edit) {
            if (curEdit) {
                curEdit.cancel();
            }
            curEdit = edit;
        }

        function pick(obj) {
            return {
                name: obj.name,
                description: obj.description,
                topic: obj.topic,
                mandatory: !!obj.mandatory
            };
        }

        // Edit class
        function EditOne(spec) {
            var E = {};
            spec = spec || {};
            E.class = spec.class || '';
            E.visible = false;
            E.toggle = toggleClick;
            E.show = show;
            E.save = save;
            E.cancel = cancel;
            //Model
            E.model = pick(emptyNew);
            E.topic = { // ui-select model
                selected: {},
                init: function (topic) {
                    this.selected = {name: topic};
                },
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
            E.groups = function () {
                return m.groups; // fix circular ref with func
            };
            var req = spec.req || null;

            function getTopic() {
                return spec.topic || (m.groups.getOpenGroup() || {}).name || '';
            }

            function toggleClick(data) {
                if (E.visible) {
                    cancel();
                }
                else {
                    show(data);
                }
            }

            function show(data) {
                var req = init(data);
                hideCur(E);
                toggle(true);

                return req; // required for search
            }

            function init(data) {
                var topic = getTopic();
                var curReq = req || angular.extend({}, emptyNew, data, {topic: topic, selected: false});

                angular.extend(E.model, pick(curReq));
                E.topic.init(topic);

                return curReq;
            }

            function save() {
                updateProject();
                updateList();
                cancel();
            }

            function updateProject() {
                var isNew = !req;
                var savedReq = null;
                if (isNew) {
                    savedReq = angular.extend({}, emptyNew, E.model, {selected: true});
                    addRemoveLocal(savedReq);
                } else {
                    savedReq = _.findWhere(m.project.requirements, {_id: req._id});
                    angular.extend(savedReq, E.model);
                }

                patchProject().then(function (res) {
                    if (isNew && res) {
                        savedReq._id = res._id; //get id from server response
                        m.groups.addItems([savedReq], true);
                    }
                });
            }

            function updateList() {
                if (!req) { return; }

                var oldTopic = req.topic;
                angular.extend(req, E.model);
                m.groups.relocate(req, oldTopic, req.topic);
            }

            function cancel() {
                angular.extend(E.model, pick(emptyNew));
                E.topic.selected = {};

                toggle(false);
                curEdit = null;
            }

            function toggle(show) {
                E.visible = (arguments.length > 0) ? show : !E.visible;
            }

            return E;
        }


        return F;
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
        G.getOpenGroup = getOpenGroup;
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

        function getOpenGroup() {
            return _.findWhere(G.list, {open: true});
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
                    group.sel = Selected(group);
                    group.editNew = m.editFactory.create({topic: it.name});

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

                // Req's edit form
                copy.edit = m.editFactory.create({topic: key, req: copy});

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
            // Reveal if hidden by accordion & focus it
            var group = getGroup(req.topic);
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
}
