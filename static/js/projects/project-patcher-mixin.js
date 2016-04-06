angular.module('PeerSay')
    .factory('ProjectPatcherMixin', ProjectPatcherMixin);

ProjectPatcherMixin.$inject = ['$stateParams', '$timeout', 'Projects', 'jsonpatch'];
function ProjectPatcherMixin($stateParams, $timeout, Projects, jsonpatch) {
    var M = applyTo;

    function applyTo(ctrl, $scope) {
        var inst = Instance($scope);
        ctrl.observe = inst.observe;
        ctrl.patchProject = inst.patchProject;
        return ctrl;
    }

    function Instance($scope) {
        var I = {};
        I.observe = observe;
        I.patchProject = patchProject;
        var projectId = $stateParams.projectId;
        var patchObserver = null;

        function observe (project) {
            patchObserver = jsonpatch.observe(project);

            $scope.$on('$destroy', function () {
                jsonpatch.unobserve(project, patchObserver);
            });
        }

        function patchProject() {
            var nullPromise = $timeout(function () {});
            var patch = jsonpatch.generate(patchObserver);
            if (!patch.length) { return nullPromise; }

            return Projects.patchProject(projectId, patch);
        }

        return I;
    }

    return M;
}
