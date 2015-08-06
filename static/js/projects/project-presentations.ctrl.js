/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectPresentationsCtrl', ProjectPresentationsCtrl);

ProjectPresentationsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'jsonpatch', 'Upload', 'Notify'];
function ProjectPresentationsCtrl($scope, $stateParams, Projects, jsonpatch, Upload, Notify) {
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
    m.onFileSelectClick = onFileSelectClick;
    m.uploadLogo = uploadLogo;
    m.uploadProgress = {
        show: false,
        value: 0,
        success: false
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

    // Logo upload
    //
    function onFileSelectClick() {
        m.data.logo.include = true;
        patchPresentation();
        Notify.hide();
        m.uploadProgress.success = false;
    }

    function uploadLogo(file) {
        if (!file) { return; } // cancelled

        var logoUploadUrl = ['/api/projects', m.projectId, 'presentation/upload/logo'].join('/');
        var options = {
            method: 'POST',
            url: logoUploadUrl,
            file: file,
            fileFormDataName: 'logo'
        };

        m.uploadProgress.show = true;
        m.uploadProgress.value = 0;

        Upload.upload(options)
            .progress(function (evt) {
                if (!evt.config.file) { return; } // cancelled

                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                m.uploadProgress.value = progressPercentage;
            })
            .success(function () {
                m.uploadProgress.success = true;
            })
            .error(function (data, status, headers, config) {
                if (status === 409 && data.error.indexOf('LIMIT_FILE_SIZE') >= 0) {
                    // Due to multer bug we see generic 500 error instead of custom json
                    Notify.show('error', {title: 'Logo upload error', text: '1 MB limit exceeded'});
                }
                else if (status === 409) {
                    Notify.show('error', {title: 'Logo upload error', text: 'Not image format'});
                }
                else {
                    Notify.show('error', {title: 'Logo upload error', text: 'Unexpected'});
                }
            })
            .finally(function () {
                m.uploadProgress.show = false;
            });

    }
}