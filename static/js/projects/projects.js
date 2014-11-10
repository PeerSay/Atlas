/*global angular:true*/

angular.module('peersay')
    .factory('Projects', Projects);

Projects.$inject = ['$q', 'restApi', 'User', 'Notification'];
function Projects($q, rest, User, Notification) {
    var P = {};
    var cache = {};

    P.projects = [];
    P.current = {
        project: null
    };
    P.create = {
        showDlg: false,
        title: ''
    };
    P.getProjectStubs = getProjectStubs;
    P.readProject = readProject;
    P.toggleCreateDlg = toggleCreateDlg;
    P.createProject = createProject;
    P.removeProject = removeProject;
    P.updateProject = updateProject;


    function getProjectStubs() {
        return User.getUser()
            .success(function () {
                P.projects = User.user.projects;
            });
    }

    function readProject(id) {
        var cached_prj = cache[id];
        if (cached_prj) {
            return cached_prj.promise; // TODO: invalidate cache, when?
        }

        var deferred = cache[id] = $q.defer();

        rest.read('projects', id)
            .success(function (data) {
                P.current.project = wrapModel(data.result);
                cache[id].resolve(P.current.project);
            })
            .error(function () {
                var err = 'Failed to read project ' + id;
                Notification.showError('API Error', err);
                cache[id].reject(err);
            });

        return deferred.promise;
    }

    function wrapModel(data) {
        var result = {};
        var defaults = data.defaults;
        delete data.defaults;

        angular.forEach(data, function (val, key) {
            result[key] = {
                value: val,
                'default': true,
                empty: false,
                ok: false
            };
        });

        return result;
    }

    function toggleCreateDlg(on) {
        P.create.showDlg = on;
    }

    function createProject() {
        return rest.create('projects', {title: P.create.title})
            .success(function (data) {
                P.projects.push(data.result);
            })
            .error(function () {
                var err = 'Failed to create project';
                Notification.showError('API Error', err);
            })
            .then(function () {
                P.create.showDlg = false; // UX: or not hide?
                P.create.title = '';
            });
    }

    function removeProject(id) {
        return rest.remove('projects', id)
            .success(function (data) {
                P.projects.splice(getIdxById(data.result.id), 1);
            })
            .error(function () {
                var err = 'Failed to remove project ' + id;
                Notification.showError('API Error', err);
            });
    }

    function updateProject(id, data) {
        return rest.update('projects', id, data)
            .error(function () {
                var err = 'Failed to update project ' + id;
                Notification.showError('API Error', err);
            });
    }

    function getIdxById(id) {
        var prj = findBy('_ref')(P.projects, id)[0];
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx
    }


    function findBy(key) {
        return function (arr, val) {
            return $.map(arr, function (obj) {
                return (obj[key] !== val) ? null : obj;
            });
        };
    }

    return P;
}
