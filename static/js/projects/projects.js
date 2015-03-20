/*global angular:true*/

angular.module('PeerSay')
    .factory('Projects', Projects);

Projects.$inject = ['Backend', 'User', 'Util'];
function Projects(Backend, User, _) {
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
    //Progress
    P.readProjectProgress = readProjectProgress;
    P.updateProjectProgress = updateProjectProgress;
    // Details
    P.current = {
        project: {
            title: '',
            description: '',
            budget: '',
            startDate: '',
            duration: ''
        }
    };
    P.readProject = readProject;
    P.patchProject = patchProject;

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
                P.projects.push(data.result);
            })
            .finally(function () {
                P.create.showDlg = false;
                P.create.title = '';
            });
    }

    function removeProject(id) {
        return Backend.remove(['projects', id])
            .then(function (data) {
                P.projects.splice(getIdxById(data.result.id), 1);
            });
    }

    // Project details
    //
    function readProject(id) {
        return Backend.read(['projects', id])
            .then(function (data) {
                var empty = {
                    title: '',
                    description: '',
                    budget: '',
                    startDate: '',
                    duration: '',
                    summary: '',
                    recommendations: '',
                    notes: ''
                };
                angular.extend(P.current.project, empty, data.result);
                return P.current.project;
            });
    }

    function patchProject(id, data) {
        var patch = data[0];
        if (patch.path === '/title') {
            // Project title is changed => invalidate Project stubs to get new titles
            Backend.invalidateCache(['user']);
        }
        Backend.invalidateCache(['projects', id]);

        console.log('Project patch: ', JSON.stringify(data));
        return Backend.patch(['projects', id], data);
    }

    // Project progress
    //
    function readProjectProgress(id) {
        return Backend.read(['projects', id, 'progress']);
    }

    function updateProjectProgress (id, data) {
        Backend.invalidateCache(['projects', id, 'progress']);
        return Backend.update(['projects', id, 'progress'], data);
    }


    function getIdxById(id) {
        var prj = _.findWhere(P.projects, { id: id });
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx;
    }

    return P;
}
