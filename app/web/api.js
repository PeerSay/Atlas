var _ = require('lodash');
var path = require('path');
var format = require('util').format;
var jsonParser = require('body-parser').json();
var multer = require('multer');
var jsonPatch = require('json-patch');
var jsonPointer = require('json-pointer');
var swig = require('swig');
var fs = require('fs-extra');

// App dependencies
var config = require(appRoot + '/app/config');
var util = require(appRoot + '/app/lib/util');
var errRes = require(appRoot + '/app/web/api-errors');
var codes = require(appRoot + '/app/web/codes');
var mailer = require(appRoot + '/app/lib/email/mailer');
var User = require(appRoot + '/app/models/users').UserModel;
var Project = require(appRoot + '/app/models/projects').ProjectModel;
var WaitingUser = require(appRoot + '/app/models/waiting-users').WaitingUserModel;

var FILES_PATH = path.join(appRoot, 'files');
var UPLOAD_LIMIT = 1024 * 1024; //1MB

function RestApi(app) {
    var U = {};

    // Files upload
    var uploader = multer({
        storage: multer.diskStorage({
            destination: logoUploadDir,
            filename: logoUploadFileName
        }),
        fileFilter: logoAcceptFormat,
        limits: {
            files: 1,
            fileSize: UPLOAD_LIMIT
        }
    });
    var upload = uploader.single('logo'); // name of the field specified on client

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
        app.delete('/api/projects/:id', deleteProject);
        app.patch('/api/projects/:id', jsonParser, patchProject);

        // project's table
        app.get('/api/projects/:id/table', readProjectTable);
        app.patch('/api/projects/:id/table', jsonParser, patchProjectTable);

        // project's presentation
        app.get('/api/projects/:id/presentation', readPresentation);
        app.patch('/api/projects/:id/presentation', patchPresentation);
        app.post('/api/projects/:id/presentation/snapshots', createPresentationSnapshot);
        app.delete('/api/projects/:id/presentation/snapshots/:snapId', deletePresentationSnapshot);
        // logo upload
        app.post('/api/projects/:id/presentation/upload/logo', uploadLogoFile);

        // NOT API - return html/pdf/image content!
        app.get('/files/:projectId/:fileName', readProjectFile);

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

            var result = prj.toJSON({getters: true, virtuals: false});
            console.log('[API] Reading presentation of project[%s] result: %s', projectId, JSON.stringify(result));

            return res.json({result: result});
        });
    }

    function patchPresentation(req, res, next) {
        var projectId = req.params.id;
        var patches = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Patching presentation of project[%s] for user=[%s] with %s', projectId, email, JSON.stringify(patches));

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project' + projectId);
            }

            // Patch
            applyPatch(prj.presentation, patches, function (err, patchRes) {
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

        console.log('[API] Creating presentation snapshot of project[%s] for user=[%s] with: %s',
            projectId, email, JSON.stringify(data));

        Project.findById(projectId)
            .populate('collaborators') // need user in presentation
            .exec(function (err, prj) {
                if (err) { return next(err); }
                if (!prj) {
                    return errRes.notFound(res, 'project:' + projectId);
                }

                var snapshots = prj.presentation.snapshots;
                var subDoc = snapshots.create(data);
                snapshots.push(subDoc);

                prj.save(function (err, newPrj) {
                    if (err) { return modelError(res, err); }

                    var result = subDoc;
                    console.log('[API] Creating presentation snapshot of project[%s] result: %s', projectId, JSON.stringify(result));

                    return res.json({result: result});
                });
            });
    }

    function deletePresentationSnapshot(req, res, next) {
        var projectId = req.params.id;
        var snapId = req.params.snapId;
        var email = req.user.email;

        // TODO - remove files

        console.log('[API] Removing presentation snapshot[%s] of project[%s] for user=[%s]', snapId, projectId, email);

        Project.findById(projectId, 'presentation.snapshots', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project:' + projectId);
            }

            var snapshots = prj.presentation.snapshots;
            var obj = _.find(snapshots, {id: Number(snapId)});
            var snap = obj && snapshots.id(obj._id);
            if (!snap) {
                console.log('[API] Removing presentation snapshot[%s] of project[%s] failed - not found', snapId, projectId);
                return errRes.notFound(res, 'snap:' + snapId);
            }

            snap.remove();
            prj.save(function (err) {
                if (err) { return modelError(res, err); }

                var result = true;
                console.log('[API] Removing presentation snapshot[%s] of project[%s] result: %s', snapId, projectId, JSON.stringify(result));

                return res.json({result: result});
            });
        });
    }

    function readProjectFile(req, res, next) {
        var projectId = req.params.projectId;
        var fileName = req.params.fileName;
        var safeFileName = util.encodeURIComponentExt(fileName);
        var s3Url = [req.protocol + '://s3.amazonaws.com', config.s3.bucket_name, projectId, safeFileName].join('/');

        // All resources, stored in DB or HTML files, use local urls which are served by static()
        // So, we get here only if file is not found and we can only:
        //  - return 404 if S3 disabled
        //  - redirect to corresponding S3 file (if S3 enabled) => may lead to 404 as well

        if (config.s3.enable) {
            console.log('[API] Read file[%s] of project[%s] missed - redirect=[%s]',
                fileName, projectId, s3Url);

            return res.redirect(s3Url);
        } else {
            console.log('[API] Read file[%s] of project[%s] missed - 404',
                fileName, projectId);

            return res.render('404', {resource: 'resourse-' + fileName});
        }
    }

    // Logo upload / read
    //
    function logoUploadDir(req, file, cb) {
        var projectId = req.params.id;
        var fileDir = path.join(FILES_PATH, projectId);

        // Directory must exist as required by multer
        fs.mkdirp(fileDir, function (err) {
            if (err) {
                console.log('[API] Upload logo: failed to create dir[%s]', fileDir);
                return cb(err);
            }

            cb(null, fileDir);
        });
    }

    function logoUploadFileName(req, file, cb) {
        var ext = path.extname(file.originalname);
        cb(null, file.fieldname + ext);
    }

    function logoAcceptFormat(req, file, cb) {
        var IMAGE_RE =/image\/.*/;
        cb(null, IMAGE_RE.test(file.mimetype));
    }

    function uploadLogoFile(req, res, next) {
        var projectId = req.params.id;
        var email = req.user.email;

        console.log('[API] Upload presentation logo of project[%s] for user=[%s]',
            projectId, email);

        Project.findById(projectId, 'presentation', function (err, prj) {
            if (err) { return next(err); }
            if (!prj) {
                return errRes.notFound(res, 'project:' + projectId);
            }

            upload(req, null, function (err) {
                if (err) {
                    console.log('[API] Upload presentation logo of project[%s] error: ', projectId, err.toString());
                    return errRes.notValid(res, err.code);
                }

                if (!req.file) {
                    console.log('[API] Upload presentation logo of project[%s] error: no file');
                    return errRes.notValid(res, 'bad file');
                }

                // Update model
                var resource = prj.presentation.data.logo.image;
                resource.fileName = req.file.filename;
                resource.sizeBytes = req.file.size;

                prj.save(function (err) {
                    if (err) { return modelError(res, err); }

                    var result = true;
                    console.log('[API] Upload presentation logo of project[%s] result: %s', projectId, resource.fileName);

                    return res.json({result: result});
                });
            });
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

    function deleteProject(req, res, next) {
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
        if (!firstPatch) { return cb(new Error('invalid patch!')); }

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
                var msg = format('Cannot cast [%s] to type [%s]', err.value, err.type);
                return msg;
            },
            'default': function () {
                return format('Exception: ', err.message);
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
