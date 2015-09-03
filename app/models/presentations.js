var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var fs = require('fs-extra');

var config = require(appRoot + '/app/config');
var util = require(appRoot + '/app/lib/util');
var s3 = require(appRoot + '/app/lib/pdf/aws-s3');
var phantom = require(appRoot + '/app/lib/pdf/phantom-pdf');
var renderer = require(appRoot + '/app/lib/pdf/render-tpl');
var Settings = require(appRoot + '/app/models/settings').SettingsModel;
var FILES_PATH = path.join(appRoot, '/files');


var resourceJSON = function (def) {
    return {
        format: {type: String, enum: ['image', 'pdf', 'html'], default: def, required: true},
        fileName: {type: String, default: ''},
        sizeBytes: {type: Number, default: 0},
        url: {type: String} // defined only by path getter
    }
};

// Snapshot schema
//
var snapshotSchema = new Schema({
    id: {type: Number}, // cannot enforce unique on subdocs
    title: {type: String, required: true},
    created: {type: Date, default: Date.now},
    visited: {type: Boolean, default: false},
    html: resourceJSON('html'),
    pdf: resourceJSON('pdf'),
    logo: resourceJSON('image')
}, {
    toJSON: {getters: true, virtuals: false}, // client app only sees path getter (generic url)
    toObject: {virtuals: true} // server can see path and virtual getters (+ local & s3 urls)
});

// Getter paths for resource's URL
//

snapshotSchema.path('logo.url').get(function () {
    return getSnapshotResourceUrl(this.parent()._id, this, 'logo');
});
snapshotSchema.path('html.url').get(function () {
    return getSnapshotResourceUrl(this.parent()._id, this, 'html');
});
snapshotSchema.path('pdf.url').get(function () {
    return getSnapshotResourceUrl(this.parent()._id, this, 'pdf');
});

function getSnapshotResourceUrl(projectId, snap, type) {
    var fileName = snap[type].fileName;
    var safeFileName = util.encodeURIComponentExt(fileName);

    return fileName && ['/files', projectId, safeFileName].join('/');
}

// Pre-Save hooks
//
snapshotSchema.pre('save', function ensureId(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Ensure auto-increment of id
    var projectId = this.parent()._id;
    Settings.nextId('pres-' + projectId, function (err, res) {
        if (err) { return next(err); }

        snap.id = res;
        next();
    });
});

snapshotSchema.pre('save', function ensureTitle(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Title format is <Project title> - <date> - <#num-today>
    var date = moment(snap.created).format("MMM Do YYYY");
    var today = moment().format('YYYYDDMM');
    var projectId = this.parent()._id;
    var key = ['pres', projectId, today].join('-');

    Settings.nextId(key, function (err, res) {
        if (err) { return next(err); }

        snap.title = [snap.title, date, '#' + res].join(' - ');
        next();
    });
});

snapshotSchema.pre('save', function ensureLogo(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Copy project logo to snapshot, each snapshot may have different logo or none
    var project = this.parent();
    var logo = project.presentation.data.logo;
    var notAvailable = logo.include && logo.image.fileName;

    if (!notAvailable) { return next(); }

    ensureSnapshotLogo(project, snap, logo, function (err, fileName, sizeBytes) {
        if (err) { return next(err); }

        snap.logo.fileName = fileName;
        snap.logo.sizeBytes = sizeBytes;
        next();
    });
});

snapshotSchema.pre('save', function ensureHTML(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Render HTML template to file
    var project = this.parent();
    renderSnapshotHTML(project, snap, function (err, fileName, sizeBytes) {
        if (err) { return next(err); }

        snap.html.fileName = fileName;
        snap.html.sizeBytes = sizeBytes;
        next();
    });
});

snapshotSchema.pre('save', function ensurePDF(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Render PDF from saved HTML file/page
    var project = this.parent();
    var projectId = project._id;

    renderSnapshotPDF(snap.html.fileName, projectId, snap.title, function (err, fileName, sizeBytes) {
        if (err) { return next(err); }

        snap.pdf.fileName = fileName;
        snap.pdf.sizeBytes = sizeBytes;
        next();
    });
});

snapshotSchema.pre('save', function ensureUploadToS3(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Need to upload at most 3 files: pdf, html and logo(optionally)
    var project = this.parent();

    uploadFilesToS3(project, snap, function (err) {
        if (err) { return next(err); }
        next();
    });
});

// Post hooks
//
snapshotSchema.post('remove', function ensureLocalUnlink(snap) {
    var projectId = this.parent()._id;
    var fileDir = path.join(FILES_PATH, projectId);

    unlinkFile(path.join(fileDir, snap.pdf.fileName));
    unlinkFile(path.join(fileDir, snap.html.fileName));
    if (snap.logo.fileName) {
        unlinkFile(path.join(fileDir, snap.logo.fileName));
    }
});

snapshotSchema.post('remove', function ensureS3delete(snap) {
    var project = this.parent();

    removeFilesFromS3(project, snap);
});


// Util
//
function ensureSnapshotLogo(project, snap, logo, cb) {
    var projectId = project._id;
    var fileName = snap.title + '.logo' + path.extname(logo.image.fileName);
    var fileDir = path.join(FILES_PATH, projectId);
    var logoPath = path.join(fileDir, logo.image.fileName);
    var snapshotLogoPath = path.join(fileDir, fileName);

    if (util.isFileExistsSync(logoPath)) {
        return copySnapshotLogo(logoPath, snapshotLogoPath, function (err) {
            if (err) { return cb(err); }
            cb(null, fileName, logo.image.sizeBytes);
        });
    }

    fs.mkdirp(fileDir, function (err) {
        if (err) {
            console.log('[DB] Snapshot logo: failed to create dir[%s]', fileDir);
            return cb(err);
        }

        // Copy back from S3 a project logs, just to turn it to snapshot logo and upload again later
        // TODO - can be optimized!
        var from = {
            subDir: projectId,
            fileName: logo.image.fileName
        };
        s3.getObject(from, logoPath)
            .then(function (res) {
                console.log('[DB] Snapshot logo: get from S3 success, res=[%s]', JSON.stringify(res));

                copySnapshotLogo(logoPath, snapshotLogoPath, function (err) {
                    if (err) { return cb(err); }
                    cb(null, fileName, logo.image.sizeBytes);
                });
            })
            .catch(function (err) {
                console.log('[DB] Snapshot logo: get from S3 failed [%s]', err.toString());
                cb(err);
            });
    });
}

function copySnapshotLogo(logoPath, snapshotLogoPath, cb) {
    console.log('[DB] Snapshot logo: copy from[%s] to[%s]', logoPath, snapshotLogoPath);

    fs.copy(logoPath, snapshotLogoPath, function (err) {
        if (err) {
            console.log('[DB] Snapshot logo: failed to copy: %s', err);
            return cb(err)
        }
        console.log('[DB] Snapshot logo copy - OK');
        cb();
    });
}

function renderSnapshotHTML(project, snap, cb) {
    var fileName = snap.title + '.html';
    var toSubDir = project._id;
    var fileDir = path.join(FILES_PATH, toSubDir);
    var filePath = path.join(fileDir, fileName);
    var logoUrl = snap.logo.url; //logo is copied first, so must be available by now

    console.log('[DB] Rendering HTML to [%s]', filePath);

    // Rendering with Swig
    var html = renderer.renderTemplate(project.toJSON(), logoUrl);

    fs.mkdirp(fileDir, function (err) {
        if (err) {
            console.log('[DB] Render HTML: failed to create dir[%s]', fileDir);
            return cb(err);
        }

        fs.writeFile(filePath, html, function (err) {
            if (err) {
                console.log('[DB] Render HTML: failed to write file[%s]', filePath);
                return cb(err);
            }

            var size = util.fileSizeSync(filePath);
            console.log('[DB] Render HTML res=[%s], size=[%s]', fileName, size);

            cb(null, fileName, size);
        });
    });
}

function renderSnapshotPDF(htmlFileName, toSubDir, title, cb) {
    var baseUrl = 'http://localhost:' + config.web.port; // Phantom is running on the same host // TODO - auth
    var htmlUrl = baseUrl + ['/files', toSubDir, util.encodeURIComponentExt(htmlFileName)].join('/');
    htmlUrl += '?print-pdf'; // this triggers pdf.css for reveal.js page
    var fileName = title + '.pdf';
    var fileDir = path.join(FILES_PATH, toSubDir);
    var filePath = path.join(fileDir, fileName);

    console.log('[DB] Rendering PDF to [%s]', filePath);

    phantom.renderPDF(htmlUrl, filePath)
        .catch(function (reason) {
            var err = reason.toString();
            console.log('[DB] Render PDF: failed [%s]', err);
            cb(err);
        })
        .then(function (file) {
            var size = util.fileSizeSync(filePath);
            console.log('[DB] Render PDF res=[%s], size=[%s]', fileName, size);

            cb(null, fileName, size);
        });
}

function uploadFilesToS3(project, snap, cb) {
    var projectId = project._id;
    var fileDir = path.join(FILES_PATH, projectId);
    var files = [];

    files.push({
        name: snap.pdf.fileName,
        path: path.join(fileDir, snap.pdf.fileName),
        contentType: 'application/pdf'
    });
    files.push({
        name: snap.html.fileName,
        path: path.join(fileDir, snap.html.fileName),
        contentType: 'text/html'
    });
    if (snap.logo.fileName) { // may not exist
        files.push({
            name: snap.logo.fileName,
            path: path.join(fileDir, snap.logo.fileName),
            contentType: 'image/' + path.extname(snap.logo.fileName).replace('.', '')
        });
    }

    s3.upload(files, {subDir: projectId})
        .then(function (res) {
            console.log('[DB] Upload files to S3 success: %s', JSON.stringify(res));
            cb(null);
        })
        .catch(function (reason) {
            cb(reason);
        });
}

function removeFilesFromS3(project, snap) {
    var projectId = project._id;
    var fromSpecs = [{
        name: snap.pdf.fileName,
        subDir: projectId
    }, {
        name: snap.html.fileName,
        subDir: projectId
    }];
    if (snap.logo.fileName) { // may not exist
        fromSpecs.push({
            name: snap.logo.fileName,
            subDir: projectId
        });
    }

    s3.remove(fromSpecs).then(function (res) {
        console.log('[DB] Remove files from S3 success: %s', JSON.stringify(res));
    });
}

function unlinkFile(path) {
    try {
        fs.removeSync(path);
    } catch (e) {
        console.log('[DB] Unlinking[%s] failed: ', path, e);
        return;
    }
    console.log('[DB] Unlinked[%s]', path);
}

// Presentation Schema
//
var presentationSchema = new Schema({
    id: false,
    data: {
        overview: {
            include: {type: Boolean, default: true},
            overviewText: {type: String, default: ''}
        },
        requirements: {
            include: {type: Boolean, default: true}
        },
        products: {
            include: {type: Boolean, default: true}
        },
        table: {
            include: {type: Boolean, default: true}
        },
        notes: {
            include: {type: Boolean, default: true},
            summaryText: {type: String, default: ''},
            recommendationText: {type: String, default: ''}
        },
        logo: {
            include: {type: Boolean, default: true},
            image: resourceJSON('image')
        }
    },
    snapshots: [snapshotSchema]
});


module.exports = {
    presentationSchema: presentationSchema
};
