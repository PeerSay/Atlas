/*global angular:true*/

angular.module('PeerSay')
    .factory('Projects', Projects);

Projects.$inject = ['Backend', 'User', 'Util', '$q', 'Storage', '$timeout'];
function Projects(Backend, User, _, $q, Storage, $timeout) {
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
    P.readProjectTable = readProjectTable;
    P.patchProject = patchProject;

    P.readPublicCategories = readPublicCategories;
    P.readPublicRequirements = readPublicRequirements;
    P.readPublicProducts = readPublicProducts;

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
        /*categories: [],
        requirements: [],
        products: []*/
    };

    /// XXX - fake data
    var fakeProject = {
        title: 'ABC project',
        reasons: 'I want a new car.',
        //goals: 'Must have wheels.',
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
        categories: [],
        requirements: [],
        products: [] // XXX - inside requirements?
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
        {id: 11, name: 'Email security', domain: 'Security'},
        {id: 12, name: 'SSD', domain: 'Storage'},
        {id: 13, name: 'RAID', domain: 'Storage'},
        {id: 14, name: 'Some storage', domain: 'Storage'}
    ];
    var fakeRequirements = [
        {id: 1, name: 'Req1', description: 'Some longer descriptio for Req1', topic: 'Support', popularity: 88},
        {id: 2, name: 'Some requiremement', description: 'Some longer descriptio forsdfsdf as', topic: 'Support', popularity: 75},
        {id: 3, name: 'All week long', description: 'Some longer descriptio for sdfs', topic: 'Support', popularity: 90},
        {id: 4, name: 'Legendary', description: 'Some longer descriptio for FDFF', topic: 'Support', popularity: 82},
        {id: 5, name: 'Free', description: 'Some longer descriptio for sd', topic: 'Price', popularity: 80},
        {id: 6, name: 'Almost free', description: 'Some longer descriptio for sdf', topic: 'Price', popularity: 77},
        {id: 7, name: 'Vistually free', description: 'Some short', topic: 'Price', popularity: 71},
        {id: 8, name: 'xxx', description: 'Some longer descriptio for sdf', topic: 'Price', popularity: 74},
        {id: 9, name: 'Firewalls', description: 'Some longer descriptio for ', topic: 'Security', popularity: 92},
        {id: 10, name: 'Fw1', description: 'Some longer descriptio for sdf', topic: 'Security', popularity: 99},
        {id: 11, name: 'Email securoty', description: 'Some longer descriptio for sdfsdf', topic: 'Security', popularity: 94},
        {id: 12, name: 'Bigger', description: 'Some longer descriptio for sefwsd', topic: 'Some', popularity: 75},
        {id: 13, name: 'Better', description: 'Some longer descriptio for 123', topic: 'Some', popularity: 80},
        {id: 14, name: 'Higher', description: 'Some longer descriptio for 123', topic: 'Some', popularity: 81}
    ];
    var fakeTopics = [
        {id: 1, name: 'Support', popularity: 20, description: ''},
        {id: 2, name: 'Price', popularity: 50, description: 'Topic description'},
        {id: 3, name: 'Security', popularity: 10, description: ''},
        {id: 4, name: 'Some', popularity: 0, description: ''}
    ];
    var fakeProducts = [
        {id: 1, name: 'Raid2', description: 'Some descr for 123', category: 'SSD', popularity: 70},
        {id: 2, name: 'ipfilter', description: 'Some descr for 12123', category: 'Firewalls', popularity: 80},
        {id: 3, name: 'ZoneAlarm', description: 'Some descr for 123 Some descr for 123', category: 'Email security', popularity: 90},
        {id: 4, name: 'Drive1', description: 'Some descr for 123', category: 'SSD', popularity: 92},
        {id: 5, name: 'VMWare', description: '', category: 'Hypervizors', popularity: 88},
        {id: 6, name: 'Bayezian', description: 'Some descr for 123s', category: 'Email security', popularity: 94},
        {id: 7, name: 'Some3', description: '', category: 'SSD', popularity: 76},
        {id: 8, name: 'FW1', description: 'Some descr for sdfsdf', category: 'Firewalls', popularity: 74},
        {id: 9, name: 'iptables', description: '', category: 'Firewalls', popularity: 87},
        {id: 10, name: 'ZoneAlarm', description: 'Some descr for 1sdfsdf3', category: 'Firewalls', popularity: 95},
        {id: 11, name: 'Xen', description: '', category: 'Hypervizors', popularity: 95},
        {id: 12, name: 'SpamFilter', description: '', category: 'Email security', popularity: 79}
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
        return Backend.create(['projects'], {title: P.create.title})
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
        return readProjectDataDbg(id)
            .then(function (data) {
                angular.extend(P.current.project, empty, data);
                return P.current.project;
            });
    }

    function readProjectData(id) {
        return Backend.read(['projects', id]);
    }

    function readProjectDataDbg(id) {
        return $q(function (resolve) {
            var data = Storage.get('project' + id) || fakeProject;
            resolve(data);
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

        //XXX
        Storage.set('project' + id, P.current.project);

        return $timeout(function () {});
        /*
         return Backend.patch(['projects', id], data);*/
    }

    function getIdxById(id) {
        var prj = _.findWhere(P.projects, {id: id});
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx;
    }

    // Categories
    //
    function readPublicCategories() {
        return $timeout(function () {
            return {categories: fakeCategories};
        });
    }

    //Requirements
    //
    function readPublicRequirements(params) {
        return readPublicRequirementsDataDbg(params).then(function (res) {
            return res;
        })
    }

    function readPublicRequirementsDataDbg(params) {
        var delay = 1000;
        var generate = (params.page > 0);

        return $timeout(function () {}, delay).then(function () {
            return {
                topics: fakeTopics,
                requirements: generate ? genFakeReqs(params) : fakeRequirements
            };
        });
    }

    function genFakeReqs(params) {
        var limit = params.limit || 10;

        var res = [];
        for (var i = 0, len = limit; i < len; i++) {
            res.push(genFakeReq());
        }
        return res;
    }

    function genFakeReq() {
        var name = Math.random().toString(36).slice(9);
        var topic = fakeTopics[randInt(fakeTopics.length - 1)].name;
        var popularity = randInt(99);
        var res = {
            id: randInt(1000000000000),
            name: name,
            description: 'Some descr for ' + name,
            topic: topic,
            popularity: popularity
        };
        return res;
    }

    //Products
    //
    function readPublicProducts(params) {
        return readPublicProductsDataDbg(params).then(function (res) {
            return {products: res};
        });
    }

    function readPublicProductsDataDbg(params) {
        var delay = 1000;

        return $timeout(function () {}, delay).then(function () {
            return genFakeProducts(params);
        });
    }

    function genFakeProducts(params) {
        var category = params.category;
        var limit = params.limit || 10;
        var maxPopularity = params.maxPopularity || 100;

        if (!category) { return []; }

        var res = [];
        for (var i = 0, len = limit; i < len; i++) {
            res.push(genFakeProduct(maxPopularity, category));
        }
        return res;
    }

    function genFakeProduct(maxPopularity, category) {
        var name = Math.random().toString(36).slice(9);
        var popularity = Math.max(0, maxPopularity - randInt(20));
        var res = {
            id: randInt(1000000000000),
            name: name,
            description: 'Some descr for ' + name,
            category: category,
            popularity: popularity
        };
        return res;
    }

    // Table
    //

    function readProjectTable(id) {
        return $timeout(function () {
            return readProjectTableDataDbg();
        });
    }

    function readProjectTableDataDbg() {
        var res = [];
        var reqs = P.current.project.requirements;
        var prods = P.current.project.products;

        _.forEach(reqs, function (req) {
            var reqCopy = angular.extend({name: '', weight: 1, products: []}, req);
            _.forEach(prods, function (prod) {
                var copyCell = angular.extend({name: '', input: '', grade: 0}, prod);
                reqCopy.products.push(copyCell);
            });
            res.push(reqCopy);
        });

        return res;
    }

    function randInt(max) {
        return Math.round(Math.random() * max);
    }

    return P;
}
