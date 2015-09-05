var _ = require('lodash');
var util = require('util');
var swig = require('swig');
var mailer = require(appRoot + '/app/lib/email/mailer');
var jsonParser = require('body-parser').json();

// App dependencies
var codes = require(appRoot + '/app/web/codes');
var Category = require(appRoot + '/app/models/categories').CategoryModel;
var Product = require(appRoot + '/app/models/products').ProductModel;
var Topic = require(appRoot + '/app/models/topics').TopicModel;
var Requirement = require(appRoot + '/app/models/requirements').RequirementModel;
var WaitingUser = require(appRoot + '/app/models/waiting-users').WaitingUserModel;


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

        // Adding user (email) to waiting list
        app.post('/api/waiting-users', jsonParser, addToWaitingUsers);
        app.post('/api/say-hello', jsonParser, sendHelloMessage);

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

    // Waiting users
    //
    function addToWaitingUsers(req, res, next) {
        var data = req.body;
        var email = data.email;

        console.log('[API] Adding user to waiting list [%s]', email);

        WaitingUser.add(email, data, function (err, user, code) {
            if (err) { next(err); }

            if (code === codes.WAITING_DUPLICATE) {
                console.log('[API] User [%s] is already in list - updated', email);
                return res.json({
                    error: email + ' is already registered!',
                    email: email
                });
            }
            console.log('[API] User [%s] has been added to the waiting list', email);

            var from = getFullEmail(data.email, data.name);
            var to = 'contact@peer-say.com';
            var locals = {
                from: from,
                to: to,
                name: email,
                inputOnProducts: data.inputOnProducts,
                inputOnRequirements: data.inputOnRequirements
            };
            var tpl = 'waiting-user';
            console.log('[API] Sending [%s] email from [%s]', tpl, from);
            mailer.send(tpl, locals); // async!

            return res.json({
                result: true,
                email: email
            });
        });
    }

    // Say Hello
    //
    function sendHelloMessage(req, res, next) {
        var data = req.body;
        var from = getFullEmail(data.email, data.name);
        var to = 'contact@peer-say.com';
        var locals = {
            from: from,
            to: to,
            name: data.name,
            message: data.message
        };
        var tpl = 'say-hello';
        console.log('[API] Sending [%s] email from [%s]', tpl, from);

        mailer.send(tpl, locals); // async!

        return res.json({result: true});
    }

    function getFullEmail(email, name) {
        var locals = {
            name: name,
            email: email
        };
        return swig.render('{{ name }} <{{ email }}>', {locals: locals});
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = PublicRestApi;
