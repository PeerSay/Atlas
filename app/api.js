var _ = require('lodash');
var path = require('path');
var util = require('util');
var jsonParser = require('body-parser').json();
var jsonPatch = require('json-patch');
var jsonPointer = require('json-pointer');
var swig = require('swig');
var fs = require('fs');

// App dependencies
var config = require('../app/config');
var errRes = require('../app/api-errors');
var User = require('../app/models/users').UserModel;
var Project = require('../app/models/projects').ProjectModel;
var WaitingUser = require('../app/models/waiting-users').WaitingUserModel;
var mailer = require('../app/email/mailer');
var phantom = require('./pdf/phantom-pdf');
var s3 = require('./pdf/s3');

var errorcodes = require('../app/errors');

var FILES_PATH = path.join(__dirname, '..', 'files');

function RestApi(app) {
    var U = {};

    function setupRoutes() {
        // Logging & auth
        app.use('/api/*', logApi);
        app.use(/\/api\/user|\/api\/projects/, ensureAuthorized); // skip authorization for /api/auth/*

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

        // project's table
        app.get('/api/projects/:id/table', readProjectTable);
        app.patch('/api/projects/:id/table', jsonParser, patchProjectTable);

        // project's presentation
        app.get('/api/projects/:id/presentation', readPresentation);
        app.patch('/api/projects/:id/presentation', patchPresentation);

        app.post('/api/projects/:id/presentation/snapshots', createPresentationSnapshot);
        app.delete('/api/projects/:id/presentation/snapshots/:snapId', removePresentationSnapshot);
        //app.post('/api/projects/:id/presentation/:presId/render-pdf', renderPresentationPDF);

        // NOT API - return html/pdf content!
        app.get('/my/projects/:id/presentation/:presId/html', renderPresentationHTML);
        app.get('/my/projects/:id/presentation/:presId/pdf', readPresentationPDF); // redirect to PDF file

        return U;
    }

    // Presentations
    //
    function readPresentation(req, res, next) {
        var projectId = req.params.id;
        var email = req.user.email;

        console.log('[API] Reading presentation of project[%s] for user=[%s]', projectId, email);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project:' + projectId);
            }

            var result = prj.toJSON({transform: xformDeleteProp('id')});
            console.log('[API] Reading presentation of project[%s] result: %s', projectId, JSON.stringify(result));

            return res.json({result: result});
        });
    }

    function patchPresentation(req, res, next) {
        var projectId = req.params.id;
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Patching presentation of project[%s] for user=[%s] with %s', projectId, email, JSON.stringify(data));

        Project.findById(projectId, 'presentation.data', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project' + projectId);
            }

            // Patch
            applyPatch(prj.presentation.data, data, function (err, patchRes) {
                if (err) { return modelError(res, err); }

                console.log('[API] Patched presentation of project[%s] result:', projectId, patchRes);

                return res.json({result: patchRes});
            });
        });
    }

    // Presentation Snapshots
    //
    function createPresentationSnapshot(req, res, next) {
        var projectId = req.params.id;
        var data = req.body;
        var email = req.user.email;

        console.log('[API] Creating presentation of project[%s] for user=[%s] with: ', projectId, email, data);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project:' + projectId);
            }

            var subDoc = prj.presentation.create(data);
            var result = prj.presentation.push(subDoc);
            prj.save(function (err) {
                if (err) { return modelError(res, err); }

                var result = subDoc;
                console.log('[API] Creating presentation of project[%s] result: %s', projectId, JSON.stringify(result));

                return res.json({result: result});
            });
        });
    }

    function removePresentationSnapshot(req, res, next) {
        var projectId = req.params.id;
        var presId = req.params.presId;
        var email = req.user.email;

        // TODO - remove files

        console.log('[API] Removing presentation[%s] of project[%s] for user=[%s]', presId, projectId, email);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project:' + projectId);
            }

            var obj = _.find(prj.presentation, {id: Number(presId)});
            var pres = prj.presentation.id(obj._id);
            if (!pres) {
                return errRes.notFound(res, 'pres:' + presId);
            }

            pres.remove();
            prj.save(function (err) {
                if (err) { return modelError(res, err); }

                var result = true;
                console.log('[API] Removing presentation[%s] of project[%s] result: %s', presId, projectId, JSON.stringify(result));

                return res.json({result: result});
            });
        });
    }

    function renderPresentationHTML(req, res, next) {
        var projectId = req.params.id;
        var presId = req.params.presId;
        var email = (req.user || {}).email; // PhantomJS calls this not-authenticated

        console.log('[API] Rendering HTML presentation[%s] of project[%s] for user=[%s]', presId, projectId, email);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return res.render('404', {resource: 'project-' + projectId});
            }

            var obj = _.find(prj.presentation, {id: Number(presId)});
            var pres = obj && prj.presentation.id(obj._id);
            if (!pres) {
                return res.render('404', {resource: 'presentation-' + presId});
            }

            console.log('[API] Rendering HTML presentation[%s] of project[%s] locals: %s',
                presId, projectId, JSON.stringify(pres));

            res.render('presentation', pres);
        });
    }

    function renderPresentationPDF(req, res, next) {
        var projectId = req.params.id;
        var presId = req.params.presId;
        var email = req.user.email;

        console.log('[API] Rendering PDF presentation[%s] of project[%s] for user=[%s]', presId, projectId, email);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project:' + projectId);
            }

            var obj = _.find(prj.presentation, {id: Number(presId)});
            var pres = prj.presentation.id(obj._id);
            if (!pres) {
                return errRes.notFound(res, 'pres:' + presId);
            }

            console.log('[API] Rendering PDF presentation[%s] of project[%s], locals: %s',
                presId, projectId, JSON.stringify(pres));

            var baseUrl = 'http://localhost:' + config.web.port; // Phantom is running on the same host
            var htmlUrl = baseUrl + ['/my/projects', projectId, 'presentation', presId, 'html'].join('/');

            var fileName = pres.title + '.pdf';
            var filePath = path.join(FILES_PATH, projectId, fileName);

            phantom.renderPDF(htmlUrl, filePath)
                .catch(function (reason) {
                    res.json({error: reason.toString()});
                })
                .then(function (file) {
                    console.log('[API] Rendered PDF presentation[%s] of project[%s], res=[%s]',
                        presId, projectId, file);

                    // Update resource
                    var resource = {
                        type: 'pdf',
                        format: 'pdf',
                        fileName: fileName
                    };
                    var subdoc = pres.resources.create(resource);
                    pres.resources.push(subdoc);
                    prj.save(function (err) {
                        if (err) { return modelError(res, err); }

                        if (!config.s3.enable) {
                            // Return generic url!
                            res.json({result: subdoc.genericUrl});
                        }

                        // Upload to S3
                        console.log('[API] Uploading PDF presentation[%s] of project[%s] to S3',
                            presId, projectId);

                        s3.upload(filePath, {subDir: projectId, fileName: fileName}, function (err, data) {
                            if (err) {
                                // TODO - correct error code
                                return errRes.notFound(res, 'failed to persist to S3');
                            }

                            console.log('[API] Upload PDF presentation[%s] of project[%s] to S3 success, res=[%s]',
                                presId, projectId, data.Location);

                            res.json({result: subdoc.genericUrl});
                        });
                    });
                });
        });
    }


    function readPresentationPDF(req, res, next) {
        var projectId = req.params.id;
        var presId = req.params.presId;
        var email = req.user.email;

        console.log('[API] Reading PDF presentation[%s] of project[%s] for user=[%s]', presId, projectId, email);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return res.render('404', {resource: 'project-' + projectId});
            }

            var obj = _.find(prj.presentation, {id: Number(presId)});
            var pres = prj.presentation.id(obj._id);
            if (!pres) {
                return res.render('404', {resource: 'presentation-' + presId});
            }

            var resource = _.find(pres.resources, {type: 'pdf'});
            if (!resource) {
                return res.render('404', {resource: 'pdf'});
            }

            var filePath = path.join(FILES_PATH, projectId, resource.fileName), stat;

            // Try local path first which is probably faster and the only option on 'dev'
            try {
                stat = fs.lstatSync(filePath);
                if (stat.isFile()) {
                    return res.redirect(resource.localUrl);
                }
            } catch(e) {}

            // Then try S3 url which may not exist and is used on stage/prod
            if (resource.s3Url) {
                return res.redirect(resource.s3Url);
            }
            else {
                return res.redirect('/tpl/');
            }
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

        User.findOne({email: email}, function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return errRes.notFound(res, email);
            }

            Project.findById(project_id, '-_id -id -__v -collaborators -categories._id -table -presentation', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, project_id);
                }

                var result = prj.toJSON({transform: xformDeleteProp('id')});
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

        User.findOne({email: email}, function (err, user) {
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
                applyPatch(prj, data, function (err, patchRes) {
                    if (err) { return modelError(res, err); }

                    console.log('[API] Patched project[%s] result:', project_id, patchRes);

                    return res.json({result: patchRes});
                });
            });
        });
    }

    // Decision Table

    function readProjectTable(req, res, next) {
        var project_id = req.params.id;
        var user = req.user;
        var email = user.email;
        var minTable = [1, 2]; // TODO - return empty table until 1x2

        console.log('[API] Reading table of project[%s] for user=[%s]', project_id, email);

        User.findOne({email: email}, function (err, user) {
            if (err) { return next(err); }
            if (!user) {
                return errRes.notFound(res, email);
            }

            Project.findById(project_id, 'table', function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, project_id);
                }

                var result = prj.toJSON({transform: xformDeleteProp('_id')});
                console.log('[API] Reading table of project[%s] result: %s', project_id, JSON.stringify(result));

                return res.json({result: result});
            });
        });
    }

    function patchProjectTable(req, res, next) {
        var project_id = req.params.id;
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Patching table of project[%s] for user=[%s] with %s', project_id, email, JSON.stringify(data));

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
                        console.log('[API] Patched table of project[%s] result:', project_id, result);

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
    function applyPatch(model, patch, cb) {
        var firstPatch = patch[0]; // only first!
        var op = firstPatch.op;
        var result = {};
        result[op] = true;

        // Using json-path lib here instead of fast-json-patch,
        // because the latter clutters Mongoose object after apply
        try {
            jsonPatch.apply(model, patch);
        }
        catch (e) {
            console.log('[API] Patch exception: ', e);
            return cb(e);
        }

        // Can get added item _id only after save
        model.save(function (err, saved) {
            if (err) { return cb(err); }

            if (op === 'add') {
                var obj = jsonPointer.get(saved, firstPatch.path);
                result.add = !!obj;
                result._id = obj && obj._id; // new _id
            }

            cb(null, result)
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

    function xformDeleteProp(prop) {
        return function (doc, ret) {
            delete ret[prop];
            return ret;
        };
    }

    // Validation & logging
    function logApi(req, res, next) {
        console.log('[API] %s %s', req.method, req.originalUrl);
        next();
    }

    function ensureAuthorized(req, res, next) {
        if (!req.user) {
            console.log('[API] Error: not authorized for %s %s [OK]', req.method, req.originalUrl);
            return errRes.notAuthorized(res, 'for API call');
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
