/*global angular:true*/

angular.module('peersay')
    .factory('Projects', Projects);

Projects.$inject = ['Backend', 'User'];
function Projects(Backend, User) {
    var P = {};

    // List
    P.projects = [];
    P.create = {
        showDlg: false,
        title: ''
    };
    P.toggleCreateDlg = toggleCreateDlg;
    P.getProjectStubs = getProjectStubs;
    P.createProject = createProject;
    P.removeProject = removeProject;
    // Details
    P.current = {
        project: null
    };
    P.readProject = readProject;
    P.updateProject = updateProject;

    // Project list
    //
    function toggleCreateDlg(on) {
        P.create.showDlg = on;
    }

    function getProjectStubs() {
        return User.readUser()
            .then(function (user) {
                return (P.projects = user.projects);
            });
    }

    function createProject() {
        return Backend.create(['projects'], { title: P.create.title })
            .then(function (data) {
                P.projects.push(data);
            })
            .finally(function () {
                P.create.showDlg = false;
                P.create.title = '';
            });
    }

    function removeProject(id) {
        return Backend.remove(['projects', id])
            .then(function (data) {
                P.projects.splice(getIdxById(data.id), 1);
            });
    }

    // Project details
    //

    // Attaching transforms
    Backend
        .use('get', ['projects', '[^\/]*$'], transformProjectModel)
        .use('put', ['projects', '[^\/]*$'], transformProjectModel);

    function readProject(id) {
        return Backend.read(['projects', id])
            .then(function (res) {
                return (P.current.project = res);
            });
    }

    function updateProject(id, data) {
        return Backend.update(['projects', id], data)
            .then(function (res) {
                // change status of updated field
                angular.forEach(res, function (item) {
                    var ctl = P.current.project[item.key];
                    ctl.value = item.value;
                    ctl.status = item.value ? 'ok' : 'missing'; // ok unless empty
                });
                return res;
            });
    }

    // Called recursively for children properties
    // Transforms { prop: val } to {
    //   key: 'prop',
    //   value: val,
    //   status: 'ok|empty|missed'
    // }
    function transformProjectModel(data, prefix) {
        var result = {};
        var defaults = angular.copy(data.defaults || []);
        delete data.defaults;

        angular.forEach(data, function (val, key) {
            if (angular.isObject(val)) {
                val.defaults = defaults;
                angular.extend(result, transformProjectModel(val, key));
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
