/*global angular:true*/

angular.module('PeerSay')
    .factory('Projects', Projects);

Projects.$inject = ['Backend', 'User', 'Util', '$q', 'Storage'];
function Projects(Backend, User, _, $q, Storage) {
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
        },
        selectedCategory: null,
        categories: []
    };

    /// XXX - fake data
    var fakeProject = {
        title: 'ABC project',
        reasons: 'I want a new car.',
        goals: 'Must have wheels.',
        time: {
            duration: 10,
            durationLabel: 'days'
        },
        resources: {
            description: '2 half-men',
            budget: '100M',
            budgetCurrency: 'USD'
        },
        selectedCategory: {id: 6, name: 'VPN', domain: 'Networking'},
        categories: []
    };

    var fakeCategories = [
        {id: 1, name: 'Category of VM1', domain: 'Virtualization'},
        {id: 2, name: 'Category of VM2', domain: 'Virtualization'},
        {id: 3, name: 'Some etc vm', domain: 'Virtualization'},
        {id: 4, name: 'Hypervizors', domain: 'Virtualization'},
        {id: 5, name: 'IPv6', domain: 'Networking'},
        {id: 6, name: 'VPN', domain: 'Networking'},
        {id: 7, name: 'Some netw', domain: 'Networking'},
        {id: 8, name: 'xxx', domain: 'Networking'},
        {id: 9, name: 'Firewalls', domain: 'Security'},
        {id: 10, name: 'Fw1', domain: 'Security'},
        {id: 11, name: 'Email securoty', domain: 'Security'},
        {id: 12, name: 'SSD', domain: 'Storage'},
        {id: 13, name: 'RAID', domain: 'Storage'},
        {id: 14, name: 'Some storage', domain: 'Storage'}
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
            var project = Storage.get('project' + id) || fakeProject;
            angular.extend(P.current.project, empty, project);

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

        //XXX
        Storage.set('project' + id, P.current.project);

        /*
        return Backend.patch(['projects', id], data);*/
    }

    function getIdxById(id) {
        var prj = _.findWhere(P.projects, { id: id });
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx;
    }

    // Categories
    //
    function readCategories(id) {
        return $q(function (resolve) {

            readProject(id).then(function (res) {
                var localCategories = res.categories;
                var categories = localCategories.concat(fakeCategories);

                resolve(categories);
            });
        });
    }

    return P;
}
