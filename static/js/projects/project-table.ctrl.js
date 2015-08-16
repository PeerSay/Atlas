angular.module('PeerSay')
    .controller('ProjectTableCtrl', ProjectTableCtrl);

ProjectTableCtrl.$inject = ['$scope', '$stateParams', 'ngTableParams', 'Projects', 'TableModel', 'jsonpatch', 'Util'];
function ProjectTableCtrl($scope, $stateParams, ngTableParams, Projects, TableModel, jsonpatch, _) {
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
        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.project, m.patchObserver);
        });

        return Projects.readProjectTable(m.projectId).then(function (res) {
            m.project = {table: res.table};
            m.patchObserver = jsonpatch.observe(m.project);

            m.loading = false;
            return res.table;
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
            var key = TableModel.groups.add(row);
            return key;
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
