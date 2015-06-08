var _ = require('lodash');
var util = require('util');

// App dependencies
var Category = require('../app/models/categories').CategoryModel;
var Product = require('../app/models/products').ProductModel;
var Topic = require('../app/models/topics').TopicModel;
var Requirement = require('../app/models/requirements').RequirementModel;

var errRes = require('../app/api-errors');
var errorcodes = require('../app/errors');


function PublicRestApi(app) {
    var U = {};

    function setupRoutes() {
        // No auth required for this api (so far)

        // Criteria & its grouping: Topics
        app.get('/api/public/topics', readTopics);
        app.get('/api/public/requirements', readRequirements);

        // Products & its grouping: Categories
        app.get('/api/public/categories', readCategories);
        app.get('/api/public/products', readProducts);

        return U;
    }

    // Criteria
    //
    function readTopics(req, res, next) {
        var email = (req.user || {}).email;

        console.log('[API] Reading public topics[%s]', email);

        // TODO
        return res.json({result: []});
    }

    function readRequirements(req, res, next) {
        var email = (req.user || {}).email;

        console.log('[API] Reading public requirements[%s]', email);

        // TODO
        return res.json({result: []});
    }

    // Products
    //

    function readCategories(req, res, next) {
        var email = (req.user || {}).email;

        console.log('[API] Reading public categories[%s]', email);

        // TODO
        return res.json({result: []});
    }

    function readProducts(req, res, next) {
        var email = (req.user || {}).email;

        console.log('[API] Reading public products[%s]', email);

        // TODO
        return res.json({result: []});
    }

    // Transforms
    //
    function xformStubPrj(doc, ret) {
        ret.id = ret._ref;
        delete ret._ref;
        delete ret._id;
        return ret;
    }

    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = PublicRestApi;
