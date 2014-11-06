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
                P.current.project = data.result;
                cache[id].resolve(data.result);
            })
            .error(function () {
                var err = 'Failed to read project ' + id;
                Notification.showError('API Error', err);
                cache[id].reject(err);
            });

        return deferred.promise;
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
                console.log('TODO: handle createProject API error');
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
                console.log('TODO: handle createProject API error');
            });
    }

    function updateProject(id, data) {
        data.id = id;
        return rest.update('projects', data)
            .error(function () {
                Notification.showError('API Error', 'Pretending there\'s no internet, in fact this API is not implemented :)');
            });
    }

    function getIdxById(id) {
        var prj = findBy('id')(P.projects, id)[0];
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
