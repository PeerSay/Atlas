/*global angular:true*/

angular.module('PeerSay')
    .controller('ProjectPresentationsCtrl', ProjectPresentationsCtrl);

ProjectPresentationsCtrl.$inject = ['$scope', '$stateParams', 'Projects', 'jsonpatch', 'Upload', 'Notify', 'Backend'];
function ProjectPresentationsCtrl($scope, $stateParams, Projects, jsonpatch, Upload, Notify, Backend) {
    var m = this;
    m.projectId = $stateParams.projectId;
    m.presentation = null;
    m.data = {};
    m.snapshots = [];
    m.patchObserver = null;
    m.patchPresentation = patchPresentation;
    m.creating = false;
    m.createSnapshot = createSnapshot;
    m.deleteSnapshot = deleteSnapshot;
    m.visitSnapshot = visitSnapshot;
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
            m.presentation = res.presentation;
            observe(m.presentation);

            m.data = res.presentation.data;
            m.snapshots = res.presentation.snapshots;
            m.logoUrl = m.data.logo.image.url || m.logoUrl;
        });
    }

    function observe(pres) {
        m.patchObserver = jsonpatch.observe(pres);

        $scope.$on('$destroy', function () {
            jsonpatch.unobserve(pres, m.patchObserver);
        });
    }

    function patchPresentation() {
        var patch = jsonpatch.generate(m.patchObserver);
        if (!patch.length) { return; }

        return Projects.patchPresentation(m.projectId, patch);
    }

    // Snapshots
    //
    function createSnapshot() {
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

    function deleteSnapshot(snap) {
        Projects.deletePresentationSnapshot(m.projectId, snap.id).then(function (res) {
            var idx = m.snapshots.indexOf(snap);
            m.snapshots.splice(idx, 1);
        });
    }

    function visitSnapshot(snap) {
        // Manually build patch
        var idx = m.snapshots.indexOf(snap); // XXX - subject to index-based patch issues!
        var patch = {
            op: 'replace',
            path: ['/snapshots', idx, 'visited'].join('/'),
            value: true
        };
        return Projects.patchPresentation(m.projectId, [patch]).then(function () {
            snap.visited = true;
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
                    Notify.show('error', {title: 'Logo upload failed', text: '1 MB limit exceeded'});
                }
                else if (status === 409) {
                    Notify.show('error', {title: 'Logo upload failed', text: 'Bad image format'});
                }
                else {
                    Notify.show('error', {title: 'Logo upload failed', text: 'Unexpected error'});
                }
            })
            .finally(function () {
                m.uploadProgress.show = false;
                // To ensure logo url will be reloaded on next page visit
                Backend.invalidateCache(['projects', m.projectId, 'presentation']);
            });

    }
}