var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var config = require('../../app/config');
var Settings = require('../../app/models/settings').SettingsModel;


// Resource schema
//
var resourceSchema = new Schema({
    format: {type: String, enum: ['image', 'pdf'], required: true},
    fileName: {type: String, required: true}
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

/*
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

// Snapshot schema
//
var snapshotSchema = new Schema({
    id: { type: Number, unique: true },
    title: {type: String, required: true},
    created: {type: Date, default: Date.now},
    html: resourceSchema,
    pdf: resourceSchema
});


snapshotSchema.pre('save', function ensureId(next) {
    var pres = this;
    if (!pres.isNew) { return next(); }

    // Ensure auto-increment of id
    var projectId = this.parent()._id;
    Settings.nextId('pres-' + projectId, function (err, res) {
        if (err) { return next(err); }

        pres.id = res;
        next();
    });
});

snapshotSchema.pre('save', function ensureTitle(next) {
    var pres = this;
    if (!pres.isNew) { return next(); }

    // Title format is <Project title> - <date> - <#num-today>
    var date = moment(pres.created).format("MMM Do YYYY");
    var today = moment().format('YYYYDDMM');
    var projectId = this.parent()._id;
    var key = ['pres', projectId, today].join('-');

    Settings.nextId(key, function (err, res) {
        if (err) { return next(err); }

        pres.title = [pres.title, date, '#' + res].join(' - ');
        next();
    });
});


// Data schema
//
var dataSchema = new Schema({
    overview: {
        include: { type: Boolean, default: true },
        overviewText: {type: String}
    },
    requirements: {
        include: { type: Boolean, default: true }
    },
    products: {
        include: { type: Boolean, default: true }
    },
    table: {
        include: { type: Boolean, default: true }
    },
    notes: {
        include: { type: Boolean, default: true },
        summaryText: {type: String},
        recommendationText: {type: String}
    },
    logo: {
        include: { type: Boolean, default: false },
        resource: resourceSchema
    }
});


// Presentation Schema
//
var presentationSchema = new Schema({
    data: dataSchema,
    snapshots: [snapshotSchema]
});


module.exports = {
    presentationSchema: presentationSchema
};
