/*global angular:true*/

angular.module('peersay')
    .factory('Projects', Projects);

Projects.$inject = ['restApi', 'User', 'Notification'];
function Projects(rest, User, Notification) {
    var P = {};

    P.projects = [];
    P.curProject = {};
    P.create = {
        showDlg: false,
        title: ''
    };
    P.getProjectStubs = getProjectStubs;
    P.getProject = getProject;
    P.toggleCreateDlg = toggleCreateDlg;
    P.createProject = createProject;
    P.removeProject = removeProject;
    P.updateProject = updateProject;


    function getProjectStubs() {
        return User.getUser()
            .success(function () {
                P.projects = User.user.projects;
                //P.projects.user = User.user; // XXX why?
            });
    }

    function getProject(id) {
        return getProjectStubs()
            .success(function () {
                // TODO: API call
                var prj = findBy('id')(P.projects, id)[0];
                P.curProject.id = prj.id;
                P.curProject.title = prj.title;
                P.curProject.duration = '6 months';
                P.curProject.budget = '$50k';
            });
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

    function updateProject(project) {
        var prj = project || P.curProject;
        return rest.update('projects', prj)
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
