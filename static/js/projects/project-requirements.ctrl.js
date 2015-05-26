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
    m.groups = {};
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
            m.groups = res.groups;

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

        if (req.selected && m.project.requirements.indexOf(req) < 0) {
            m.project.requirements.unshift(req); // local
        }

        patchProject();
    }

    function toggleGroup(group) {
        var on = group.selected;
        _.forEach(group.reqs, function (req) {
            req.selected = on;
            if (req.selected && m.project.requirements.indexOf(req) < 0) {
                m.project.requirements.unshift(req); // local
            }
        });

        patchProject();
    }

    function toggleGroupByReq(req) {
        var group = m.groups[req.topic];
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
