var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var psShortId = require('./short-id').psShortId;
var moment = require('moment');

//Requirement
var presentationSubSchema = new Schema({
    //TODO: id: psShortId,
    title: {type: String, required: true},
    created: {type: Date, default: Date.now},
    resources: [{
        type: {type: String, enum: ['logo', 'pdf'], required: true},
        format: {type: String, enum: ['image', 'pdf'], required: true},
        location: {type: String, required: true}
    }]
    // TODO: data or pages
});

presentationSubSchema.pre('save', function ensureTitle(next) {
    var pres = this;
    if (!pres.isNew) { return next(); }

    // Title format is <Project title> - <date> - <#num-today>
    var date = moment(pres.created).format("MMM Do YYYY");
    var numToday = 1; // XXX
    pres.title = [pres.title, date, '#' + numToday].join(' - ');

    next();
});

module.exports = {
    presentationSubSchema: presentationSubSchema
};
