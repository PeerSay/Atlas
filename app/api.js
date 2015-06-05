var _ = require('lodash');
var util = require('util');
var jsonParser = require('body-parser').json();
var jsonpatch = require('json-patch');
var swig = require('swig');

// App dependencies
var errRes = require('../app/api-errors');
var User = require('../app/models/users').UserModel;
var Project = require('../app/models/projects2').ProjectModel;
var WaitingUser = require('../app/models/waiting-users').WaitingUserModel;
var mailer = require('../app/email/mailer');

var errorcodes = require('../app/errors');


function RestApi(app) {
    var U = {};

    function setupRoutes() {
        // Logging & auth
        app.use('/api/*', logApi);
        app.use(/\/user|\/projects/, ensureAuthorized); // skip authorization for /api/auth/*

        // Adding user (email) to waiting list
        app.post('/api/waiting-users', jsonParser, addToWaitingUsers);
        app.post('/api/say-hello', jsonParser, sendHelloMessage);

        // user
        app.get('/api/user', readUser);

        // projects
        app.post('/api/projects', jsonParser, createProject);
        app.get('/api/projects/:id', readProject);
        app.delete('/api/projects/:id', removeProject);
        app.patch('/api/projects/:id', jsonParser, patchProject);

        // project's criteria
        app.get('/api/projects/:id/criteria', readProjectCriteria);
        app.patch('/api/projects/:id/criteria', jsonParser, patchProjectCriteria);
        return U;
    }

    // Waiting users

    function addToWaitingUsers(req, res, next) {
        var data = req.body;
        var email = data.email;

        console.log('[API] Adding user to waiting list [%s]', email);

        WaitingUser.add(email, data, function (err, user, code) {
            if (err) { next(err); }

            if (code === errorcodes.WAITING_DUPLICATE) {
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

        return res.json({ result: true });
    }

    function getFullEmail(email, name) {
        var locals = {
            name: name,
            email: email
        };
        return swig.render('{{ name }} <{{ email }}>', {locals: locals});
    }

    // User
    //
    function readUser(req, res, next) {
        var email = req.user.email;

        console.log('[API] Reading user[%s]', email);

        User.findOne({email: email}, 'id -_id email name projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return errRes.notFound(res, email);
            }

            var result = user.toJSON({transform: xformUser, virtuals: true}); // need virtuals for name.full
            console.log('[API] Reading user[%s] result: %s', email, JSON.stringify(result));

            return res.json({result: result});
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
                return errRes.notFound(res, email);
            }

            Project.createByUser(data, user, function (err, stubPrj) {
                if (err) { return next(err); }

                var result = stubPrj.toJSON({transform: xformStubPrj}); // stub is enough for create
                console.log('[API] Creating project result: %s', JSON.stringify(result));

                return res.json({result: result});
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
                return errRes.notFound(res, email);
            }

            Project.removeByUser(project_id, user, function (err, doc) {
                if (err) { return next(err); }

                if (!doc) {
                    console.log('[API] Removing project[%s] failed - not found!', project_id);
                    return errRes.notFound(res, project_id);
                }

                var result = {id: project_id, removed: true};
                console.log('[API] Removing project[%s] result: %s', project_id, JSON.stringify(result));

                return res.json({result: result});
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
                return errRes.notFound(res, email);
            }

            Project.findById(project_id, '-_id -id -__v -collaborators -criteria', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, project_id);
                }

                var result = prj.toJSON({transform: xformProject});
                console.log('[API] Reading project[%s] result: %s', project_id, JSON.stringify(result));

                return res.json({result: result});
            });
        });
    }

    function patchProject(req, res, next) {
        var project_id = req.params.id;
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Patching project[%s] for user=[%s] with %s', project_id, email, JSON.stringify(data));

        User.findOne({email: email}, 'projects', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return errRes.notFound(res, email);
            }

            Project.findById(project_id, function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, project_id);
                }

                // Patch
                applyPatch(prj, data, function (err) {
                    if (err) { return modelError(res, err); }

                    prj.save(function (err) {
                        if (err) { return modelError(res, err); }

                        var result = true; // no need to send data back
                        console.log('[API] Patched project[%s] result:', project_id, result);

                        return res.json({result: result});
                    });
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
                return errRes.notFound(res, email);
            }

            Project.findById(project_id, 'criteria', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, project_id);
                }

                var result = prj.toJSON({transform: xformProjectCriteria});
                console.log('[API] Reading criteria of project[%s] result: %s', project_id, JSON.stringify(result));

                return res.json({result: result});
            });
        });
    }

    function patchProjectCriteria(req, res, next) {
        var project_id = req.params.id;
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Patching criteria of project[%s] for user=[%s] with %s', project_id, email, JSON.stringify(data));

        User.findOne({email: email}, 'projects.criteria', function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return errRes.notFound(res, email);
            }

            Project.findById(project_id, 'criteria', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, project_id);
                }

                // Patch
                applyPatch(prj, data, function (err) {
                    if (err) { return modelError(res, err); }

                    prj.save(function (err) {
                        if (err) { return modelError(res, err); }

                        var result = true; // no need to send data back
                        console.log('[API] Patched criteria of project[%s] result:', project_id, result);

                        return res.json({result: result});
                    });
                });
            });
        });
    }

    /**
     * Patch format (see rfc6902):
     * [
     *  {"op":"replace", "path":"/criteria/0/vendors/0/input", "value":2},
     *  {"op":"add", "path":"/criteria/1/vendors/-", "value":{"title":"IMB","input":1}},
     *  ...
     * ]
     * */
    function applyPatch(obj, patch, cb) {
        //console.log('[API] Applying patch: ', patch);
        try {
            jsonpatch.apply(obj, patch);
        }
        catch (e) {
            console.log('[API] Patch exception: ', e);
            return cb(e);
        }

        return cb(null, obj);
    }

    // Transforms

    function xformStubPrj(doc, ret) {
        ret.id = ret._ref;
        delete ret._ref;
        delete ret._id;
        return ret;
    }

    function xformUser(doc, ret) {
        if (ret.name) {
            if (ret.name.full) {
                ret.name = ret.name.full;
            }
            else {
                delete ret.name;
            }
        }
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

    // Validation & logging
    function logApi(req, res, next) {
        console.log('[API] %s %s', req.method, req.originalUrl);
        next();
    }

    function ensureAuthorized(req, res, next) {
        if (!req.user) {
            return errRes.notAuthorized(res);
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
                return util.format('Exception: ', err.message);
            }
        };

        var error = errors[err.name] || errors.default;
        var errorMsg = error();
        console.log('[API] Model error:', errorMsg);

        return errRes.notValid(res, errorMsg);
    }

    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = RestApi;
