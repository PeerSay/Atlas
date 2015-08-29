var _ = require('lodash');
var path = require('path');
var format = require('util').format;
var jsonParser = require('body-parser').json();
var multer = require('multer');
var jsonPatch = require('json-patch');
var jsonPointer = require('json-pointer');
var fs = require('fs-extra');

// App dependencies
var config = require(appRoot + '/app/config');
var util = require(appRoot + '/app/lib/util');
var errRes = require(appRoot + '/app/web/api-errors');
var User = require(appRoot + '/app/models/users').UserModel;
var Project = require(appRoot + '/app/models/projects').ProjectModel;

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

        // user
        app.get('/api/user', readUser);

        // projects
        app.post('/api/projects', jsonParser, createProject);
        app.delete('/api/projects/:id', deleteProject);
        app.get('/api/projects/:id', ensureProject, readProject);
        app.patch('/api/projects/:id', jsonParser, ensureProject, patchProject);

        // project's presentation
        app.post('/api/projects/:id/presentation/snapshots', createPresentationSnapshot);
        app.delete('/api/projects/:id/presentation/snapshots/:snapId', ensureProject, deletePresentationSnapshot);
        // logo upload
        app.post('/api/projects/:id/presentation/upload/logo', ensureProject, uploadLogoFile);

        // NOT API - return html/pdf/image content!
        app.get('/files/:id/:fileName', ensureProject, readProjectFile);

        return U;
    }

    function ensureProject(req, res, next) {
        var projectId = req.params.id;
        var email = req.user.email;

        console.log('[API] Resolving project[%s] for user=[%s]', projectId, email);

        Project.findById(projectId, function (err, prj) {
            if (err) { return next(err); }

            //TODO - check content type & send

            if (!prj) {
                console.log('[API] Resolving project[%s] error - not found!', projectId);
                return errRes.notFound(res, 'project:' + projectId);
            }

            req.project = prj;
            next();
        });
    }

    // User
    //
    function readUser(req, res, next) {
        var user = req.user;
        var email = user.email;

        var result = user.toJSON({transform: xformUser, virtuals: true}); // need virtuals for name.full
        console.log('[API] Reading user[%s] result: %s', email, JSON.stringify(result));

        return res.json({result: result});
    }

    // Projects
    //
    function createProject(req, res, next) {
        var data = req.body;
        var user = req.user;
        var email = user.email;

        console.log('[API] Creating project for user=[%s]', email);

        Project.createByUser(data, user, function (err, stubPrj) {
            if (err) { return next(err); }

            var result = stubPrj.toJSON({transform: xformStubPrj}); // stub is enough for create
            console.log('[API] Creating project result: %s', JSON.stringify(result));

            return res.json({result: result});
        });
    }

    function deleteProject(req, res, next) {
        var projectId = req.params.id;
        var user = req.user;
        var email = user.email;

        console.log('[API] Removing project[%s] for user=[%s]', projectId, email);

        Project.removeByUser(projectId, user, function (err, doc) {
            if (err) { return next(err); }

            if (!doc) {
                console.log('[API] Removing project[%s] failed - not found!', projectId);
                return errRes.notFound(res, projectId);
            }

            var result = {id: projectId, removed: true};
            console.log('[API] Removing project[%s] result: %s', projectId, JSON.stringify(result));

            return res.json({result: result});
        });
    }

    function readProject(req, res, next) {
        var project = req.project;

        var result = project.toJSON({transform: xformDeleteProps('__v'), getters: true}); // need getters for snapshot urls
        console.log('[API] Reading project[%s] result: %s', project.id, JSON.stringify(result));

        return res.json({result: result});
    }

    function patchProject(req, res, next) {
        var data = req.body;
        var email = req.user.email;
        var project = req.project;
        var projectId = project.id;

        console.log('[API] Patching project[%s] for user=[%s] with %s', projectId, email, JSON.stringify(data));

        applyPatch(project, data, function (err, patchRes) {
            if (err) { return modelError(res, err); }

            console.log('[API] Patched project[%s] result:', projectId, patchRes);

            return res.json({result: patchRes});
        });
    }

    // Presentation Snapshots
    //
    function createPresentationSnapshot(req, res, next) {
        var data = req.body;
        var email = req.user.email;
        var projectId = req.params.id;

        console.log('[API] Creating presentation snapshot of project[%s] for user=[%s] with: %s',
            projectId, email, JSON.stringify(data));

        Project.findById(projectId) // Cannot reuse req.project here - model error is raised
            .populate('collaborators') // need user email in presentation
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
        var email = req.user.email;
        var project = req.project;
        var projectId = project.id;
        var snapId = req.params.snapId;

        console.log('[API] Removing presentation snapshot[%s] of project[%s] for user=[%s]', snapId, projectId, email);

        var snapshots = project.presentation.snapshots;
        var obj = _.find(snapshots, {id: Number(snapId)});
        var snap = obj && snapshots.id(obj._id);
        if (!snap) {
            console.log('[API] Removing presentation snapshot[%s] of project[%s] failed - not found', snapId, projectId);
            return errRes.notFound(res, 'snap:' + snapId);
        }

        snap.remove(); // <-

        project.save(function (err) {
            if (err) { return modelError(res, err); }

            var result = true;
            console.log('[API] Removing presentation snapshot[%s] of project[%s] result: %s', snapId, projectId, JSON.stringify(result));

            return res.json({result: result});
        });
    }

    function readProjectFile(req, res, next) {
        var projectId = req.project.id;
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
        var projectId = req.project.id;
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
        var email = req.user.email;
        var project = req.project;
        var projectId = project.id;

        console.log('[API] Upload presentation logo of project[%s] for user=[%s]',
            projectId, email);

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
            var resource = project.presentation.data.logo.image;
            resource.fileName = req.file.filename;
            resource.sizeBytes = req.file.size;

            project.save(function (err) {
                if (err) { return modelError(res, err); }

                var result = true;
                console.log('[API] Upload presentation logo of project[%s] result: %s', projectId, resource.fileName);

                return res.json({result: result});
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
        delete ret._id;

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

    function xformDeleteProps(prop) {
        var props = [].slice.call(arguments);

        return function (doc, ret) {
            props.forEach(function (prop) {
                delete ret[prop];
            });
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
