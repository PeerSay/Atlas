/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectPresentationsCtrl', ProjectPresentationsCtrl);

ProjectPresentationsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'jsonpatch', 'Upload'];
function ProjectPresentationsCtrl($scope, $stateParams, Projects, jsonpatch, Upload) {
    var m = this;
    m.projectId = $stateParams.projectId;
    m.data = {};
    m.snapshots = [];
    m.patchObserver = null;
    m.patchPresentation = patchPresentation;
    m.creating = false;
    m.createPresentationSnapshot = createPresentationSnapshot;
    m.deletePresentationSnapshot = deletePresentationSnapshot;
    // Logo upload
    m.logoFile = null;
    m.logoUrl = '//placehold.it/48x48';
    m.uploadLogo = uploadLogo;
    m.uploadProgress = {
        show: false,
        value: 0
    };


    activate();

    function activate() {
        readPresentation();

        $scope.$watch('pr.logoFile', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                uploadLogo(m.logoFile);
            }
        });
    }

    function readPresentation() {
        Projects.readPresentation(m.projectId).then(function (res) {
            m.data = res.presentation.data;
            m.patchObserver = jsonpatch.observe(m.data);

            m.snapshots = res.presentation.snapshots;
            m.logoUrl = m.data.logo.image.url || m.logoUrl;
        });

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(m.data, m.patchObserver);
        });
    }

    function patchPresentation() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        return Projects.patchPresentation(m.projectId, patch);
    }

    // Snapshots
    //
    function createPresentationSnapshot() {
        var data = {title: Projects.current.project.title};

        m.creating = true;
        Projects.createPresentationSnapshot(m.projectId, data)
            .then(function (res) {
                m.snapshots.push(res);
            })
            .finally(function () {
                m.creating = false;
            });
    }

    function deletePresentationSnapshot(snap) {
        Projects.deletePresentationSnapshot(m.projectId, snap.id).then(function (res) {
            var idx = m.snapshots.indexOf(snap);
            m.snapshots.splice(idx, 1);
        });
    }

    function renderPresentationPDF(pres) {
        pres.rendering = true;
        Projects.renderPresentationPDF(m.projectId, pres.id)
            .then(function (res) {
                pres.pdfUrl = res;
            })
            .finally(function () {
                pres.rendering = false;
            });
    }

    // Logo
    function uploadLogo(file) {
        var logoUploadUrl = ['/api/projects', m.projectId, 'presentation/upload/logo'].join('/');
        var options = {
            method: 'POST',
            url: logoUploadUrl,
            file: file,
            fileFormDataName: 'logo'
        };

        m.uploadProgress.show = true;

        Upload.upload(options)
            .progress(function (evt) {
                if (!evt.config.file) { return; }

                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                m.uploadProgress.value = progressPercentage;
            })
            .success(function (data, status, headers, config) {
                console.log('file ' + config.file.name + ' uploaded. Response: ' + JSON.stringify(data));
            })
            .error(function (data, status, headers, config) {
                console.log('Logo upload error: ' + status);
            })
            .finally(function () {
                m.uploadProgress.show = false;
            });

    }
}