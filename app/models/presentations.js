var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var psShortId = require('./lib/short-id').psShortId;
var moment = require('moment');

var Settings = require('../../app/models/settings').SettingsModel;


//Requirement
var presentationSubSchema = new Schema({
    id: { type: Number, unique: true },
    title: {type: String, required: true},
    created: {type: Date, default: Date.now},
    resources: [{
        type: {type: String, enum: ['logo', 'pdf'], required: true},
        format: {type: String, enum: ['image', 'pdf'], required: true},
        location: {type: String, required: true}
    }]
    // TODO: data or pages
});

presentationSubSchema.pre('save', function ensureId(next) {
    var pres = this;
    if (!pres.isNew) { return next(); }

    // ensure auto-increment of id

    var projectId = this.parent()._id;
    Settings.nextId('pres-' + projectId, function (err, res) {
        if (err) { return next(err); }

        pres.id = res;
        next();
    });
});

presentationSubSchema.pre('save', function ensureTitle(next) {
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

module.exports = {
    presentationSubSchema: presentationSubSchema
};
