/*global angular:true*/

angular.module('PeerSay')
    .factory('Projects', Projects);

Projects.$inject = ['Backend', 'User', 'Util', '$q'];
function Projects(Backend, User, _, $q) {
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
        project: {
            title: ''
        }
    };
    P.readProject = readProject;
    P.patchProject = patchProject;

    P.readCategories = readCategories;

    var empty = {
        title: '',
        reasons: '',
        goals: '',
        summary: '',
        recommendations: '',
        notes: '',
        // Time
        time: {
            startDate: '',
            duration: 0,
            durationLabel: 'days'
        },
        // Resources
        resources: {
            description: '',
            budget: '',
            budgetCurrency: 'USD'
        }
    };

    /// XXX - fake data
    var fakeProject = {
        title: 'ABC project',
        reasons: 'I want a new car.',
        goals: 'Must have wheels.',
        time: {
            duration: 10
        },
        resources: {
            description: '2 half-men',
            budget: '100M'
        },
        selectedCategory: {name: 'VPN', domain: 'Networking'}
    };

    var fakeCategories = [
        {name: 'Category of VM1', domain: 'Virtualization'},
        {name: 'Category of VM2', domain: 'Virtualization'},
        {name: 'Some etc vm', domain: 'Virtualization'},
        {name: 'Hypervizors', domain: 'Virtualization'},
        {name: 'IPv6', domain: 'Networking'},
        {name: 'VPN', domain: 'Networking'},
        {name: 'Some netw', domain: 'Networking'},
        {name: 'xxx', domain: 'Networking'},
        {name: 'Firewalls', domain: 'Security'},
        {name: 'Fw1', domain: 'Security'},
        {name: 'Email securoty', domain: 'Security'},
        {name: 'SSD', domain: 'Storage'},
        {name: 'RAID', domain: 'Storage'},
        {name: 'Some storage', domain: 'Storage'}
    ];


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
                return data.result;
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
        return $q(function (resolve) {
            angular.extend(P.current.project, empty, fakeProject);
            resolve(P.current.project);
        });


        /*return Backend.read(['projects', id])
            .then(function (data) {

                angular.extend(P.current.project, empty, data.result);
                return P.current.project;
            });*/
    }

    function patchProject(id, data) {
        var patch = data[0];
        if (patch.path === '/title') {
            // Project title is changed => invalidate Project stubs to get new titles
            Backend.invalidateCache(['user']);
        }
        Backend.invalidateCache(['projects', id]);

        console.log('Project patch: ', JSON.stringify(data));
        //XXX - return Backend.patch(['projects', id], data);
    }

    function getIdxById(id) {
        var prj = _.findWhere(P.projects, { id: id });
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx;
    }

    // Categories
    //
    function readCategories() {
        return $q(function (resolve) {
            resolve(fakeCategories);
        });
    }

    return P;
}
