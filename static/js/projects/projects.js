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

    // Format:
    /*var a = {
        "_id": "",
        "title": "",
        "categories": [],
        "products": [],
        "requirements": [],
        "notes": {
            "reasons": "",
            "goals": "",
            "resources": "",
            "summary": "",
            "recommendations": ""
        },
        "budget": {
            "amount": 0,
            "amountMultiplier": "K",
            "amountMultipliers": "K,M", // r/o
            "currencyLabel": "USD",
            "currencyLabels": "USD,EUR,GBP,ILS,RUB,BTC" // r/o
        },
        "time": {
            "startDate": "2015-06-05T21:32:30.058Z", // ISO date
            "duration": 0,
            "durationLabel": "days",
            "durationLabels": "days,weeks,months" // r/o
        }
    };*/
    function readProject(id) {
        return readProjectData(id)
            .then(function (data) {
                return (P.current.project = data.result);
            });
    }

    function readProjectData(id) {
        return Backend.read(['projects', id]);
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

        return $timeout(function () {
        });
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
        return Backend.read(['public', 'categories']);
    }

    //Requirements
    //
    function readPublicRequirements(params) {
        return readPublicRequirementsData(params).then(function (data) {
            return data.result;
        })
    }

    function readPublicRequirementsData() {
        // TODO - params: limit/from
        return Backend.read(['public', 'requirements']);
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

        return $timeout(function () {
        }, delay).then(function () {
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
