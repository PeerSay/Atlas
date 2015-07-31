var _ = require('lodash');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');
var swig = require('swig');
var fs = require('fs-extra');

var config = require('../../app/config');
var Settings = require('../../app/models/settings').SettingsModel;
var s3 = require('../../app/pdf/aws-s3');
var phantom = require('../../app/pdf/phantom-pdf');
var presentationTpl = swig.compileFile(path.join(__dirname, '../../static/tpl/presentation.html'));
var FILES_PATH = path.join(__dirname, '../../files');


// Resource schema
//
/*
var resourceSchema = new Schema({
    format: {type: String, enum: ['image', 'pdf', 'html'], required: true},
    fileName: {type: String, required: true}
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

resourceSchema.virtual('genericUrl').get(function () {
    var resource = this;
    var projectId = resource.parent().parent()._id;
    var presId = resource.parent().id;

    // Generic URL for clients is /my/projects/:id/presentations/:presId/pdf
    return ['/my/projects', projectId, 'presentations', presId, 'pdf'].join('/');
});

resourceSchema.virtual('localUrl').get(function () {
    var resource = this;
    var projectId = resource.parent().parent()._id;
    var safeFileName = encodeRFC5987ValueChars(resource.fileName);

    // Locally files are mounted to /files/<projectId>/<fileName>
    return ['/files', projectId, safeFileName].join('/');
});

resourceSchema.virtual('s3Url').get(function () {
    if (!config.s3.enable) {
        return null;
    }
    var resource = this;
    var projectId = resource.parent().parent()._id;
    var bucketName =  config.s3.bucket_name;
    var safeFileName = encodeRFC5987ValueChars(resource.fileName);

    // S3 url is https://s3.amazonaws.com/<bucket_name>/<projectId>/<fileName>
    return ['https://s3.amazonaws.com', bucketName, projectId, safeFileName].join('/');
});

// Courtesy by MDN
function encodeRFC5987ValueChars(str) {
    return encodeURIComponent(str).
        // Note that although RFC3986 reserves "!", RFC5987 does not,
        // so we do not need to escape it
        replace(/['()]/g, escape). // i.e., %27 %28 %29
        replace(/\*!/g, '%2A').
        // The following are not required for percent-encoding per RFC5987,
        // so we can allow for a little better readability over the wire: |`^
        replace(/%(?:7C|60|5E)/g, unescape);
}

*/


var resourceJSON = function (def) {
    return {
        format: {type: String, enum: ['image', 'pdf', 'html'], default: def, required: true},
        fileName: {type: String, default: ''}
    }
};

// Snapshot schema
//
var snapshotSchema = new Schema({
    id: { type: Number, unique: true },
    title: {type: String, required: true},
    created: {type: Date, default: Date.now},
    html: resourceJSON('html'),
    pdf: resourceJSON('pdf')
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
    var projectId = project._id;
    var data = _.extend({}, project.presentation.data, {title: snap.title});
    renderSnapshotHTML(data, projectId, function (err, fileName) {
        if (err) { return next(err); }

        snap.html.fileName = fileName;
        next();
    });
});

snapshotSchema.pre('save', function ensurePDF(next) {
    var snap = this;
    if (!snap.isNew) { return next(); }

    // Render PDF from saved HTML file/page
    var project = this.parent();
    var projectId = project._id;

    renderSnapshotPDF(snap.html.fileName, projectId, snap.title, function (err, fileName) {
        if (err) { return next(err); }

        snap.pdf.fileName = fileName;
        next();
    });
});


function renderSnapshotHTML(locals, toSubDir, cb) {
    var fileName = locals.title + '.html';
    var fileDir = path.join(FILES_PATH, toSubDir);
    var filePath = path.join(fileDir, fileName);
    var html = presentationTpl(locals);

    console.log('[DB] Rendering HTML to [%s]', filePath);

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

            console.log('[DB] Render HTML res=[%s]', fileName);
            cb(null, fileName);
        });
    });
}


function renderSnapshotPDF(htmlFileName, toSubDir, title, cb) {
    var baseUrl = 'http://localhost:' + config.web.port; // Phantom is running on the same host // TODO - auth
    var htmlUrl = baseUrl + ['/files', toSubDir, encodeRFC5987ValueChars(htmlFileName)].join('/');
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
            console.log('[DB] Render PDF res=[%s]', fileName);
            cb(null, fileName);
        });
}

function encodeRFC5987ValueChars(str) {
    return encodeURIComponent(str).
        // Note that although RFC3986 reserves "!", RFC5987 does not,
        // so we do not need to escape it
        replace(/['()]/g, escape). // i.e., %27 %28 %29
        replace(/\*!/g, '%2A').
        // The following are not required for percent-encoding per RFC5987,
        // so we can allow for a little better readability over the wire: |`^
        replace(/%(?:7C|60|5E)/g, unescape);
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
            include: {type: Boolean, default: false},
            resource: resourceJSON('image')
        }
    },
    snapshots: [snapshotSchema]
});


module.exports = {
    presentationSchema: presentationSchema
};
