var _ = require('lodash');
var jsonParser = require('body-parser').json();

// App dependencies
var User = require('../app/models/users').UserModel;


// util - TODO
function isEmpty(obj) {
    return !Object.keys(obj).length;
}


function RestApi(app) {
    var U = {};

    function setupRoutes() {
        // validation & logging
        app.use('/api/*', logApi, validateAccept);
        app.post('/api/*', jsonParser, validateBody);
        app.use(/\/user|\/projects/, ensureAuthorized); // skip authorization for /api/auth/*

        // user
        app.get('/api/user', readUser);

        // projects
        app.post('/api/projects', createProject);
        app.delete('/api/projects/:id', removeProject);
        return U;
    }

    // User
    //
    function readUser(req, res, next) {
        var email = req.user.email;

        console.log('[API] Read user [%s]', email);

        User.findOne({email: email}, 'id -_id email name projects.id projects.title', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            res.json({ result: user });
        });
    }

    // Projects
    //
    function createProject(req, res, next) {
        var project = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Creating project for user=[%s]', email);

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            user.createProject(project, function (err, prj) {
                if (err) { return next(err); }
                res.json({ result: prj });
            });
        });
    }

    function removeProject(req, res) {
        var project_id = Number(req.params.id);
        var user = req.user;
        var email = user.email;

        console.log('[API] Removing project for user=[%s]', email);

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            user.removeProject(project_id, function (err, result) {
                if (err) { return next(err); }
                res.json({ result: result });
            });
        });
    }

    // Validation
    function logApi(req, res, next) {
        console.log('[API] %s %s', req.method, req.originalUrl);
        next();
    }

    function ensureAuthorized(reg, res, next) {
        if (!req.user) {
            return notAuthorized(res);
        }
        next();
    }

    function validateAccept(req, res, next) {
        res.format({
            json: function () {
                next();
            },
            'default': function () {
                notAcceptable(res);
            }
        });
    }

    function validateBody(reg, res, next) {
        if (isEmpty(reg.body)) {
            badRequest(res, 'No JSON'); // TODO: post({}) should be OK
        }
        next();
    }

    function modelError(res, err) {
        var errors = {
            ValidationError: function () {
                var key = Object.keys(err.errors)[0];
                var msg = [key, err.errors[key].type].join(' ');
                return msg;
            },
            MongoError: function () {
                if (err.code === 11000) { // non unique
                    var error_msg = /dup key:.*"(.*?)"/.exec(err.err);
                    var msg = [error_msg[1], 'exists'].join(' ');
                    return msg;
                }
                else {
                    return 'db validation';
                }
            }
        };

        return notValid(res, errors[err.name]());
    }

    function notAuthorized(res) {
        return res
            .status(401)
            .send({error: 'Not Authorized'});
    }

    function notAcceptable(res) {
        return res
            .status(406)
            .send({error: 'Not Acceptable'});
    }

    function badRequest(res, msg) {
        return res
            .status(400)
            .send({error: 'Bad request: ' + msg});
    }

    function notFound(res, msg) {
        return res
            .status(404)
            .send({error: 'Not found: ' + msg});
    }

    function notValid(res, msg) {
        return res
            .status(409)
            .send({error: 'Not valid: ' + msg});
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = RestApi;
