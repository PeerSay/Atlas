var _ = require('lodash');
var util = require('util');

// App dependencies
var Category = require('../app/models/categories').CategoryModel;
var Product = require('../app/models/products').ProductModel;
var Topic = require('../app/models/topics').TopicModel;
var Requirement = require('../app/models/requirements').RequirementModel;


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

        Topic.find()
            .sort('-popularity')
            .select('-__v')
            .exec(function (err, data) {
                if (err) { return next(err); }
                console.log('[API] Reading public topics result: items: %d', data.length);

                res.json({result: data});
            });
    }

    function readRequirements(req, res, next) {
        var email = (req.user || {}).email;
        var category = req.query.q || '';
        var orSelector = [{category: ''}, {category: {$exists: false }}];
        if (category) {
            orSelector.push({category: category});
        }

        console.log('[API] Reading public requirements[%s]: category=[%s]', email, category);

        Requirement.find().or(orSelector)
            .sort('-popularity')
            .select('-__v')
            .exec(function (err, data) {
                if (err) { return next(err); }
                console.log('[API] Reading public requirements result: items: %d', data.length);

                res.json({result: data});
            });
    }

    // Products
    //

    function readCategories(req, res, next) {
        var email = (req.user || {}).email;

        console.log('[API] Reading public categories[%s]', email);

        Category.find()
            .sort('-popularity')
            .select('-__v')
            .exec(function (err, data) {
                if (err) { return next(err); }
                console.log('[API] Reading public categories result: items: %d', data.length);

                res.json({result: data});
            });
    }

    function readProducts(req, res, next) {
        var email = (req.user || {}).email;
        var category = req.query.q;

        console.log('[API] Reading public products[%s]: category=[%s]', email, category);

        Product.find({category: category})
            .sort('-popularity')
            .select('-__v')
            .exec(function (err, data) {
                if (err) { return next(err); }
                console.log('[API] Reading public products result: items: %d', data.length);

                res.json({result: data});
            });
    }

    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = PublicRestApi;
