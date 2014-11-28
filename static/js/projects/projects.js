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
    // Create
    P.create = {
        showDlg: false,
        title: ''
    };
    P.toggleCreateDlg = toggleCreateDlg;
    // REST
    P.getProjectStubs = getProjectStubs;
    P.readProject = readProject;
    P.readProjectCriteria = readProjectCriteria;
    P.updateProjectCriteria = updateProjectCriteria;
    P.createProject = createProject;
    P.removeProject = removeProject;
    P.updateProject = updateProject;


    function getProjectStubs() {
        return User.getUser()
            .success(function () {
                P.projects = User.user.projects;
            });
    }

    function read(params) {
        var key = params.join('/');
        var cached_prj = cache[key];
        if (cached_prj) {
            return cached_prj.promise;
        }
        var deferred = cache[key] = $q.defer();

        rest.read(params)
            .success(function (data) {
                cache[key].resolve(data.result);
            })
            .error(function () {
                var err = 'Failed to read ' + key;
                Notification.showError('API Error', err);
                cache[key].reject(err);
            });

        return deferred.promise;
    }

    function invalidateCache(params) {
        var key = params.join('/');
        delete cache[key];
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


    function readProject(id) {
        return read(['projects', id])
            .then(function (res) {
                P.current.project = wrapAndFlattenModel(res);
            });
    }

    function createProject() {
        return rest.create(['projects'], {title: P.create.title})
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
        return rest.remove(['projects', id])
            .success(function (data) {
                P.projects.splice(getIdxById(data.result.id), 1);
            })
            .error(function () {
                var err = 'Failed to remove project ' + id;
                Notification.showError('API Error', err);
            });
    }

    function updateProject(id, data) {
        var params = ['projects', id];
        return rest.update(params, data)
            .success(function (res) {
                var prj = wrapAndFlattenModel(res.result);
                angular.forEach(prj, function (item) {
                    var ctl = P.current.project[item.key];
                    ctl.value = item.value;
                    ctl.status = item.value ? 'ok' : 'missing'; // ok unless empty
                });

                invalidateCache(params);
            })
            .error(function () {
                var err = 'Failed to update project ' + id;
                Notification.showError('API Error', err);
            });
    }

    // Criteria
    //
    function readProjectCriteria(id) {
        return read(['projects', id, 'criteria']);
    }

    function updateProjectCriteria(id, data) {
        var params = ['projects', id, 'criteria'];
        return rest.update(params, data)
            .success(function () {
                invalidateCache(params);
            })
            .error(function () {
                var err = 'Failed to update project ' + id;
                Notification.showError('API Error', err);
            });
    }


    // Util
    //
    function getIdxById(id) {
        var prj = findBy('id')(P.projects, id)[0];
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx;
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
