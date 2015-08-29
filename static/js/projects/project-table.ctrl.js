angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'TableModel', 'jsonpatch', 'StorageRecord', 'Util'];
function ProjectTableCtrl($scope, $stateParams, Projects, TableModel, jsonpatch, StorageRecord, _) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.shared = Projects.current; // for title
    m.patchObserver = null;
    m.patchProject = patchProject;
    m.loading = true;
    // Table model/view
    m.tableView = null;
    m.getCsv = TableModel.getCsv.bind(TableModel);


    activate();

    function activate() {
        return Projects.readProject(m.projectId)
            .then(function (res) {
                observe({table: res.table});

                m.tableView = getView(res);
                return res;
            }).finally(function () {
                m.loading = false;
            });
    }

    function observe(project) {
        m.patchObserver = jsonpatch.observe(project);
        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(project, m.patchObserver);
        });
    }

    function patchProject() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        Projects.patchProject(m.projectId, patch);
    }

    function getView(project) {
        var view = {};
        var model = TableModel.buildModel(project.table);
        initGroups(model);

        view.ctrl = m;
        view.columns = model.columns;
        view.rows = model.rows;
        view.groups = TableModel.groups.list;
        view.topicWeights = project.topicWeights.reduce(function (acc, it) {
            return [].concat(acc, {name: it.topic.slice(0, 3), w: it.weight});
        }, []);
        return view;
    }

    function initGroups(model) {
        var groupIdx = {};
        _.forEach(model.rows, function (row) {
            var expandedState = StorageRecord.boolean(getExpandedGroupKey(row.req.topic));
            var key = TableModel.groups.add(row, expandedState);
            var group = groupIdx[key] = groupIdx[key] || [];
            group.push(row);
        });
        return groupIdx;
    }

    function getExpandedGroupKey(topic) {
        return ['table', m.projectId, topic.replace(/\W/g, '')].join('-');
    }

    // Data formats:
    //
    //@formatter:off
    /* table = [{
        "reqId": "",
        "name": "",
        "mandatory": true|false,
        "weight": 1,
        "popularity": 0,
        "products": [{
            "prodId": "",
            "name": "",
            "input": "",
            "grade": 0,
            "popularity": 0
        }]

        topicWeights = [{
          "topic": "",
          "weight": 0-1
        }]
    }]*/
    //@formatter:on
}
