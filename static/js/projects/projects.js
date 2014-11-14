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
                P.current.project = wrapAndFlattenModel(data.result);
                //console.log('>> Wrapped model', P.current.project);
                cache[id].resolve(P.current.project);
            })
            .error(function () {
                var err = 'Failed to read project ' + id;
                Notification.showError('API Error', err);
                cache[id].reject(err);
            });

        return deferred.promise;
    }

    function wrapAndFlattenModel(data, prefix) {
        var result = {};
        var defaults = angular.copy(data.defaults || []);
        delete data.defaults;

        angular.forEach(data, function (val, key) {
            if (angular.isObject(val)) {
                val.defaults = defaults;
                angular.extend(result, wrapAndFlattenModel(val, key));
            }
            else {
                var dotted_key = prefix ? [prefix, key].join('.') : key;
                result[dotted_key] = {
                    key: dotted_key,
                    value: val,
                    status: getStatus(prefix || key, val, defaults)
                };
            }
        });

        return result;

        function getStatus(key, val, defaults) {
            if (!val) { return 'empty'; }
            if (defaults && defaults.indexOf(key) >= 0) { return 'default'; }
            return 'ok';
        }
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
                P.create.showDlg = false;
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
            .success(function (res) {
                var data = wrapAndFlattenModel(res.result);
                angular.forEach(data, function (item) {
                    var ctl = P.current.project[item.key];
                    ctl.value = item.value;
                    ctl.status = 'ok'; // ok if update is successful
                });
            })
            .error(function () {
                var err = 'Failed to update project ' + id;
                Notification.showError('API Error', err);
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
