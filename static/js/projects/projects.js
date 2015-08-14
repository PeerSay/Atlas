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
        progress: false
    };
    P.toggleCreateDlg = toggleCreateDlg;
    P.getProjectStubs = getProjectStubs;
    P.createProject = createProject;
    P.removeProject = removeProject;
    // Details
    P.current = {
        project: {},
        table: []
    };
    // Read
    P.readProject = readProject;
    P.readProjectTable = readProjectTable;
    P.readPublicCategories = readPublicCategories;
    P.readPublicProducts = readPublicProducts;
    P.readPublicRequirements = readPublicRequirements;
    P.readPublicTopics = readPublicTopics;
    // Patch
    P.patcher = Patcher();
    P.patchProject = patchProject;
    // Presentations
    P.readPresentation = readPresentation;
    P.patchPresentation = patchPresentation;
    P.createPresentationSnapshot = createPresentationSnapshot;
    P.deletePresentationSnapshot = deletePresentationSnapshot;

    // Project list
    //
    function toggleCreateDlg(on) {
        P.create.showDlg = on;
    }

    function getProjectStubs() {
        return User.readUser().then(function (user) {
            return (P.projects = user.projects);
        });
    }

    function createProject(data) {
        P.create.progress = true;
        return Backend.create(['projects'], data)
            .then(function (data) {
                P.projects.push(data.result);
                return data.result;
            })
            .finally(function () {
                P.create.showDlg = false;
                P.create.progress = false;
            });
    }

    function removeProject(id) {
        return Backend.remove(['projects', id]).then(function (data) {
            P.projects.splice(getIdxById(data.result.id), 1);
        });
    }

    // Project details
    //
    //@formatter:off
    /* Format: {
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
    //@formatter:on

    function readProject(id) {
        return Backend.read(['projects', id]).then(function (data) {
            return (P.current.project = data.result);
        });
    }

    // Table
    //
    //@formatter:off
    /* Format: [{
        "reqId": "",
        "name": "",
        "weight": 1,
        "popularity": 0,
        "products": [{
            "prodId": "",
            "name": "",
            "input": "",
            "grade": 0,
            "popularity": 0
        }]
    }]*/
    //@formatter:on
    function readProjectTable(id) {
        return Backend.read(['projects', id, 'table']).then(function (data) {
            return (P.current.table = data.result);
        });
    }

    //Requirements / Topics
    //
    function readPublicTopics() {
        return Backend.read(['public', 'topics']).then(function (data) {
            return {topics: data.result};
        });
    }

    function readPublicRequirements(params) {
        return Backend.read(['public', 'requirements'], null, params).then(function (data) {
            return {requirements: data.result};
        });
    }

    // Products / Categories
    //
    function readPublicCategories() {
        return Backend.read(['public', 'categories']).then(function (data) {
            return {categories: data.result};
        });
    }

    function readPublicProducts(params) {
        return Backend.read(['public', 'products'], null, params).then(function (data) {
            return {products: data.result};
        });
    }

    // Patch
    //
    function patchProject(id, data) {
        return P.patcher.release(id, data).then(function (res) {
            return res.result;
        });
    }

    function Patcher() {
        var P = {};
        P.release = release;

        function release(id, data) {
            console.log('Project[%s] patch: ', id, JSON.stringify(data));

            invalidateCache(id, data);
            return Backend.patch(['projects', id], data);
        }

        function invalidateCache(id, patches) {
            var categoryChanged = _.findWhere(patches, {path: '/selectedCategory'});
            if (categoryChanged) {
                // Project category/title is changed => invalidate Project stubs to get new titles
                Backend.invalidateCache(['user']);
            }

            var tableChanged = /\/products|\/requirements/.test(patches[0].path); // always single patch?
            if (tableChanged) {
                Backend.invalidateCache(['projects', id, 'table']);
            }

            Backend.invalidateCache(['projects', id]);
        }

        return P;
    }

    // Presentations
    //
    function readPresentation(projectId) {
        return Backend.read(['projects', projectId, 'presentation']).then(function (data) {
            return data.result;
        });
    }

    function patchPresentation(projectId, data) {
        Backend.invalidateCache(['projects', projectId, 'presentation']);
        return Backend.patch(['projects', projectId, 'presentation'], data);
    }

    function createPresentationSnapshot(projectId, data) {
        Backend.invalidateCache(['projects', projectId, 'presentation']);
        return Backend.create(['projects', projectId, 'presentation', 'snapshots'], data).then(function (data) {
            return data.result;
        });
    }

    function deletePresentationSnapshot(projectId, snapId) {
        Backend.invalidateCache(['projects', projectId, 'presentation']);
        return Backend.remove(['projects', projectId, 'presentation', 'snapshots', snapId]).then(function (data) {
            return data.result;
        });
    }

    // Misc
    function getIdxById(id) {
        var prj = _.findWhere(P.projects, {id: id});
        var idx = P.projects.indexOf(prj);
        return idx < 0 ? P.projects.length : idx;
    }

    return P;
}
