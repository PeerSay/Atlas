var jsonParser = require('body-parser').json();
var Joi = require('joi');

var util = require('../app/util');
var errRes = require('../app/api-errors');


function ApiValidate(app) {
    var V = {};

    function setupRoutes() {
        app.use('/api/*', validateAccept);
        app.post('/api/*', jsonParser, validateBody);
        app.put('/api/*', jsonParser, validateBody);
        app.patch('/api/*', jsonParser, validateBody);

        // Auth
        app.post('/api/auth/login', jsonParser, validateAuthLogin);
        app.post('/api/auth/signup', jsonParser, validateAuthSignup);
        app.post('/api/auth/restore', jsonParser, validateEmailRequired);
        app.post('/api/auth/restore/complete', jsonParser, validateAuthRestoreComplete);

        // Public (don't require auth)
        app.post('/api/waiting-users', jsonParser, validateEmailRequired);
        app.post('/api/say-hello', jsonParser, validateSayHello);

        return V;
    }

    function validateAccept(req, res, next) {
        res.format({
            json: function () {
                // if no Accept, json is considered
                res.type('json');
                next();
            },
            'default': function () {
                errRes.notAcceptable(res, req.headers.accept);
            }
        });
    }

    function validateBody(reg, res, next) {
        if (util.isEmptyObj(reg.body)) {
            return errRes.badRequest(res, 'not JSON');
        }
        next();
    }

    // Auth
    function validateAuthLogin(req, res, next) {
        var data = req.body;
        var schema = {
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            longSession: Joi.boolean().required()
        };

        Joi.validate(data, schema, function (err) {
            if (err) {
                var msg = err.details[0].message;
                return errRes.notValid(res, msg);
            }
            next();
        });
    }

    function validateAuthSignup(req, res, next) {
        var data = req.body;
        var schema = {
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        };

        Joi.validate(data, schema, function (err) {
            if (err) {
                var msg = err.details[0].message;
                return errRes.notValid(res, msg);
            }
            next();
        });
    }

    function validateEmailRequired(req, res, next) {
        var data = req.body;
        var schema = {
            email: Joi.string().email().required()
        };
        var options = {allowUnknown: true}; // used only to validate required email - ignore the rest

        Joi.validate(data, schema, options, function (err) {
            if (err) {
                var msg = err.details[0].message;
                return errRes.notValid(res, msg);
            }
            next();
        });
    }

    function validateAuthRestoreComplete(req, res, next) {
        var data = req.body;
        var schema = {
            code: Joi.string().alphanum().min(6).required(),
            password: Joi.string().min(6).required()
        };

        Joi.validate(data, schema, function (err) {
            if (err) {
                var msg = err.details[0].message;
                return errRes.notValid(res, msg);
            }
            next();
        });
    }

    function validateSayHello(req, res, next) {
        var data = req.body;
        var schema = {
            email: Joi.string().email().required(),
            name: Joi.string(),
            message: Joi.string().required()
        };

        Joi.validate(data, schema, function (err) {
            if (err) {
                var msg = err.details[0].message;
                return errRes.notValid(res, msg);
            }
            next();
        });
    }


    V.setupRoutes = setupRoutes;
    return V;
}


module.exports = ApiValidate;
