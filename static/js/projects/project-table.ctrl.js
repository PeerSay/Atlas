angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$stateParams', 'ngTableParams', 'Projects', 'TableModel', 'jsonpatch', 'StorageRecord'];
function ProjectTableCtrl($scope, $stateParams, ngTableParams, Projects, TableModel, jsonpatch, StorageRecord) {
    var m = this;

    m.projectId = $stateParams.projectId;
    m.shared = Projects.current; // for title
    m.project = null;
    m.patchObserver = null;
    m.patchProject = patchProject;
    m.loading = true;
    m.activate = activate;
    // Table model/view
    var table = Table(m);
    m.tableView = table.getView();
    m.getCsv = TableModel.getCsv.bind(TableModel);


    // Called by Table
    function activate() {
        return Projects.readProjectTable(m.projectId).then(function (res) {
            m.project = {table: res.table};
            observe(m.project);

            m.loading = false;
            return res.table;
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

    // Table Class
    function Table(ctrl) {
        var T = {};
        T.getView = getView;

        // ngTable params
        var settings = {
            counts: [], // remove paging
            defaultSort: 'asc',
            getData: getData,
            groupBy: groupBy
        };
        var parameters = {
            count: 2 // must be at least one prop different from defaults!
        };
        var view = {};

        // ngTable stuff
        function getView() {
            view.ctrl = ctrl;
            view.tableParams = new ngTableParams(parameters, settings);
            return view;
        }

        function groupBy(row) {
            var expandedState = StorageRecord.boolean(getExpandedGroupKey(row.req.topic));
            var key = TableModel.groups.add(row, expandedState);
            return key;
        }

        function getExpandedGroupKey(topic) {
            return ['table', m.projectId, topic.replace(/\W/g, '')].join('-');
        }

        // Model
        function getData($defer) {
            ctrl.activate().then(function (reqs) {
                var model = TableModel.buildModel(reqs);
                view.columns = model.columns;
                view.rows = model.rows;
                view.groups = TableModel.groups;

                $defer.resolve(model.rows);
            });
        }

        return T;
    }
}
