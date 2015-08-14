var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var fs = require('fs-extra');

var config = require('../../app/config');
var util = require('../../app/util');
var Settings = require('../../app/models/settings').SettingsModel;
var s3 = require('../../app/pdf/aws-s3');
var phantom = require('../../app/pdf/phantom-pdf');
var render = require('../../app/pdf/render-tpl');
var FILES_PATH = path.join(__dirname, '../../files');


var resourceJSON = function (def) {
    return {
        format: {type: String, enum: ['image', 'pdf', 'html'], default: def, required: true},
        fileName: {type: String, default: ''},
        sizeBytes: {type: Number},
        url: {type: String} // defined only by path getter
    }
};

// Snapshot schema
//
var snapshotSchema = new Schema({
    id: {type: Number}, // cannot enforce unique on subdocs
    title: {type: String, required: true},
    created: {type: Date, default: Date.now},
    html: resourceJSON('html'),
    pdf: resourceJSON('pdf')
}, {
    toJSON: {getters: true, virtuals: false}, // client app only sees path getter (generic url)
    toObject: {virtuals: true} // server can see path and virtual getters (+ local & s3 urls)
});

snapshotSchema.path('html.url').get(function () {
    var snap = this;
    var projectId = snap.parent()._id;
    return getSnapshotResourceUrls(projectId, snap, 'html').generic;
});
snapshotSchema.virtual('html.localUrl').get(function () {
    var snap = this;
    var projectId = snap.parent()._id;
    return getSnapshotResourceUrls(projectId, snap, 'html').local;
});
snapshotSchema.virtual('html.s3Url').get(function () {
    var snap = this;
    var projectId = snap.parent()._id;
    return getSnapshotResourceUrls(projectId, snap, 'html').s3;
});

snapshotSchema.path('pdf.url').get(function () {
    var snap = this;
    var projectId = snap.parent()._id;
    return getSnapshotResourceUrls(projectId, snap, 'pdf').generic;
});
snapshotSchema.virtual('pdf.localUrl').get(function () {
    var snap = this;
    var projectId = snap.parent()._id;
    return getSnapshotResourceUrls(projectId, snap, 'pdf').local;
});
snapshotSchema.virtual('pdf.s3Url').get(function () {
    var snap = this;
    var projectId = snap.parent()._id;
    return getSnapshotResourceUrls(projectId, snap, 'pdf').s3;
});


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

snapshotSchema.pre('save', function ensureHTML(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Render HTML template to file
    var project = this.parent();
    renderSnapshotHTML(project, snap.title, function (err, fileName, sizeBytes) {
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


// Post hooks
//

snapshotSchema.post('remove', function ensureLocalUnlink(doc) {
    var projectId = this.parent()._id;
    var fileDir = path.join(FILES_PATH, projectId);

    unlinkFile(path.join(fileDir, doc.pdf.fileName));
    unlinkFile(path.join(fileDir, doc.html.fileName));
});


/*TODO
 *
 * s3.upload(filePath, {subDir: projectId, fileName: fileName}, function (err, data) {
 if (err) {
 // TODO - correct error code
 return errRes.notFound(res, 'failed to persist to S3');
 }

 console.log('[API] Upload PDF presentation[%s] of project[%s] to S3 success, res=[%s]',
 presId, projectId, data.Location);

 res.json({result: subdoc.genericUrl});
 });
 * */

// Util
//
function renderSnapshotHTML(project, name, cb) {
    var fileName = name + '.html';
    var toSubDir = project._id;
    var fileDir = path.join(FILES_PATH, toSubDir);
    var filePath = path.join(fileDir, fileName);

    console.log('[DB] Rendering HTML to [%s]', filePath);

    // Rendering with Swig
    var html = render.renderTemplate(project);

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

function getSnapshotResourceUrls(projectId, snap, type) {
    var safeFileName = util.encodeURIComponentExt(snap[type].fileName);
    var bucketName = config.s3.bucket_name;

    return {
        generic: ['/my/projects', projectId, 'presentation/snapshots', snap.id, type].join('/'),
        local: ['/files', projectId, safeFileName].join('/'),
        s3: ['https://s3.amazonaws.com', bucketName, projectId, safeFileName].join('/')
    };
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
