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
    m.requirements = [];
    m.groups = GroupBy('topic');
    m.patchObserver = null;
    // Filters
    m.filter = {
        name: 'all',
        expr: {}
    };
    m.filterClass = filterClass;
    m.toggleFilter = toggleFilter;
    m.showFilteredGroup = showFilteredGroup;
    // Selections
    m.toggleGroup = toggleGroup;
    m.toggleReq = toggleReq;
    m.getTotalSelected = getTotalSelected;

    var filterExprs = {
        all: {},
        selected: {selected: true},
        'not-selected': {selected: false}
    };
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
        requirement: emptyNew
    };
    m.toggleAddNew = toggleAddNew;
    m.cancelAddNew = cancelAddNew;
    m.saveAddNew = saveAddNew;

    activate();

    function activate() {
        Projects.readRequirements(m.projectId).then(function (res) {
            m.requirements = res.reqs;
            m.groups.add(res.reqs);

            console.log('>>', res);

            m.project = res.project;
            m.patchObserver = jsonpatch.observe(m.project);
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }


    // Filters
    //
    function filterClass(name) {
        return {active: m.filter.name === name};
    }

    function toggleFilter(name) {
        m.filter.name = name;
        m.filter.expr = filterExprs[name];
    }

    function showFilteredGroup(group) {
        var arr = filterFilter(group.reqs, m.filter.expr);
        return (arr.length !== 0);
    }

    // Selection
    //
    function toggleReq(req) {
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
        var group = m.groups.list[req.topic];
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
        return filterFilter(m.requirements, filterExprs.selected).length;
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

        m.groups.add([req]);

        addRemoveLocal(req); // always selected!
        patchProject();
    }

    // Grouping
    //
    function GroupBy(prop) {
        var G = {};
        G.list = {};
        G.add = add;

        function add(arr) {
            _.forEach(arr, function (it) {
                var key = it[prop];
                var group = G.list[key] = G.list[key] || {
                        reqs: [],
                        name: key,
                        selected: false
                    };
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
