var _ = require('lodash');
var jsonParser = require('body-parser').json();

// App dependencies
var User = require('../app/models/users').UserModel;
var Project = require('../app/models/projects').ProjectModel;


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
        app.put('/api/*', jsonParser, validateBody);
        app.use(/\/user|\/projects/, ensureAuthorized); // skip authorization for /api/auth/*

        // user
        app.get('/api/user', readUser);

        // projects
        app.post('/api/projects', createProject);
        app.get('/api/projects/:id', readProject);
        app.put('/api/projects/:id', updateProject);
        app.delete('/api/projects/:id', removeProject);
        return U;
    }

    // User
    //
    function readUser(req, res, next) {
        var email = req.user.email;

        console.log('[API] Read user [%s]', email);

        User.findOne({email: email}, 'id -_id email name projects.title projects._ref projects._stub', function (err, user) {
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
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Creating project for user=[%s]', email);

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            Project.createByUser(data, user, function (err, stubPrj) {
                if (err) { return next(err); }

                res.json({ result: stubPrj }); // stub is enough for create
            });
        });
    }

    function removeProject(req, res, next) {
        var project_id = req.params.id;
        var user = req.user;
        var email = user.email;

        console.log('[API] Removing project[%s] for user=[%s]', project_id, email);

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            Project.removeByUser(project_id, user, function (err) {
                if (err) { return next(err); }

                res.json({ result: {
                    id: project_id,
                    removed: true
                }});
            });
        });
    }

    function readProject(req, res, next) {
        var project_id = req.params.id;
        var user = req.user;
        var email = user.email;

        console.log('[API] Reading project[%s] for user=[%s]', project_id, email);

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            Project.findOne({_id: project_id}, '-_id -__v -collaborators', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return notFound(res, project_id);
                }

                res.json({ result: prj });
            });
        });
    }

    function updateProject(req, res, next) {
        var project_id = req.params.id;
        var new_data = req.body;
        var user = req.user;
        var email = user.email;

        // Allow only one field update per op
        var path = Object.keys(new_data)[0];
        var new_value = new_data[path];
        var select = path.split('.')[0]; // to return full object after update

        console.log('[API] Updating project[%s] for user=[%s] with %s', project_id, email, JSON.stringify(new_data));

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            Project.findOne({_id: project_id}, function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return notFound(res, project_id);
                }

                prj.set(path, new_value);

                prj.save(function (err, data) {
                    if (err) { return next(err); }

                    var result = _.pick(prj, select);
                    res.json({ result: result });
                });
            });
        });
    }


    // Validation
    function logApi(req, res, next) {
        console.log('[API] %s %s', req.method, req.originalUrl);
        next();
    }

    function ensureAuthorized(req, res, next) {
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
