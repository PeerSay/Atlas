/*global angular:true*/

angular.module('peersay')
    .factory('Projects', Projects);

Projects.$inject = ['restApi', 'Users'];
function Projects(rest, Users) {
    var P = {};

    //P.user = Users.user;
    P.projects = [];
    P.create = {
        showDlg: false,
        title: ''
    };
    P.getProjects = getProjects;
    P.toggleCreateDlg = toggleCreateDlg;
    P.createProject = createProject;
    P.removeProject = removeProject;


    function getProjects() {
        return rest.read('users', Users.user.id)
            .success(function (data) {
                P.projects = data.result.projects;
            })
            .error(function () {
                console.log('TODO: handle getProjects API error');
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
                P.projects.splice(getIdxbyId(data.result.id), 1);
            })
            .error(function () {
                console.log('TODO: handle createProject API error');
            });
    }

    function getIdxbyId(id) {
        var res = P.projects.length; // out-of-bounds
        $.each(P.projects, function (i, v) {
            if (v.id === id) {
                res = i;
                return false;
            }
        });
        return res;
    }

    return P;
}
