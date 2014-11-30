var _ = require('lodash');
var util = require('util');
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
        app.delete('/api/projects/:id', removeProject);
        app.put('/api/projects/:id', updateProject);
        app.get('/api/projects/:id/criteria', readProjectCriteria);
        app.put('/api/projects/:id/criteria', updateProjectCriteria);
        return U;
    }

    // User
    //
    function readUser(req, res, next) {
        var email = req.user.email;

        console.log('[API] Reading user[%s]', email);

        User.findOne({email: email}, 'id -_id email name projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            var result = user.toJSON({ transform: xformUser });
            console.log('[API] Reading user[%s] result:', email, result);

            return res.json({ result: result });
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

                var result = stubPrj.toJSON({ transform: xformStubPrj}); // stub is enough for create
                console.log('[API] Creating project result:', result);

                return res.json({ result: result });
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

                var result = { id: project_id, removed: true };
                console.log('[API] Removing project[%s] result:', project_id, result);

                return res.json({ result: result});
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

            Project.findById(project_id, '-_id -id -__v -collaborators -criteria', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return notFound(res, project_id);
                }

                var result = prj.toJSON({ virtuals: true, transform: xformProject}); // virtuals give duration.days
                console.log('[API] Reading project[%s] result:', project_id, result);

                return res.json({ result: result });
            });
        });
    }

    function updateProject(req, res, next) {
        var project_id = req.params.id;
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Updating project[%s] for user=[%s] with %s', project_id, email, JSON.stringify(data));

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            var path = _.keys(data)[0]; // allow only one field update per op!
            var new_value = data[path];
            var select = path.split('.')[0]; // to select full object and return after update (e.g. duration)
            var select_full = select + ' defaults'; // to update defaults in pre-save

            Project.findOne({_id: project_id}, select_full, function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return notFound(res, project_id);
                }

                // update
                prj.set(path, new_value);
                prj.markModified(path); // ensure pre-save hook removes default even if value is not changed

                prj.save(function (err, data) {
                    if (err) { return modelError(res, err); }

                    var result = _.pick(data.toJSON(), select);
                    console.log('[API] Updating project[%s] result:', project_id, result);

                    return res.json({ result: result });
                });
            });
        });
    }

    // Criteria

    function readProjectCriteria(req, res, next) {
        var project_id = req.params.id;
        var user = req.user;
        var email = user.email;

        console.log('[API] Reading criteria of project[%s] for user=[%s]', project_id, email);

        User.findOne({email: email}, 'projects.criteria', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            Project.findById(project_id, 'criteria', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return notFound(res, project_id);
                }


                var result = prj.toJSON({ virtuals: false, transform: xformProjectCriteria});
                console.log('[API] Reading criteria of project[%s] result:', project_id, result);

                return res.json({ result: result });
            });
        });
    }

    function updateProjectCriteria(req, res, next) {
        var project_id = req.params.id;
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Updating criteria of project[%s] for user=[%s]', project_id, email);

        User.findOne({email: email}, 'projects.criteria', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return notFound(res, email);
            }

            Project.findById(project_id, 'criteria', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return notFound(res, project_id);
                }

                // Replace all
                prj.criteria.splice.apply(prj.criteria, [].concat(0, prj.criteria.length, data.criteria));

                prj.save(function (err) {
                    if (err) { return modelError(res, err); }

                    var result = true; // no need to send data back
                    console.log('[API] Updating criteria of project[%s] result:', project_id, result);

                    return res.json({ result: result });
                });
            });
        });
    }

    // Transforms

    function xformStubPrj(doc, ret) {
        ret.id = ret._ref;
        delete ret._ref;
        delete ret._id;
        return ret;
    }

    function xformUser(doc, ret) {
        if (typeof doc.ownerDocument === 'function') { // this is sub doc
            return xformStubPrj(doc, ret);
        }
        return ret;
    }

    function xformProject(doc, ret) {
        delete ret.id; // id=null returned despite '-id'
        return ret;
    }

    function xformProjectCriteria(doc, ret) {
        delete ret._id;
        return ret;
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
                var error = err.errors[key];
                var message = error && error.message;
                var msg = message || [key, error.type].join(' ');
                return msg;
            },
            MongoError: function () {
                if (err.code === 11000) { // non unique
                    var error_msg = /dup key:.*"(.*?)"/.exec(err.err);
                    var msg = [error_msg[1], 'exists'].join(' ');
                    return msg;
                }
                else {
                    return 'MongoError code ' + err.code;
                }
            },
            CastError: function () {
                var msg = util.format('Cannot cast [%s] to type [%s]', err.value, err.type);
                return msg;
            },
            'default': function () {
                return util.format('Model error:', err.message);
            }
        };

        var error = errors[err.name] || errors.default;
        var error_msg = error();
        console.log('[API] Model error:', error_msg);

        return notValid(res, error_msg);
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
