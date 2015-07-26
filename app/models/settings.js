var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// Service schema/model for short incremental ids
//
var options = {strict: false};

var settingsSchema = new Schema({
    //nextUserId: { type: Number, default: 1 }, // legacy
    name: {type: String, required: true},
    nextId: { type: Number, default: 1 }
}, options);

settingsSchema.statics.nextId = function (name, cb) {

    Settings.findOneAndUpdate({name: name}, {$inc: {nextId: 1}}, {upsert: true}, function (err, doc) {
        if (err) { return cb(err); }

        if (name !== 'user' || doc.nextId > 1) {
            return cb(null, doc.nextId);
        }

        // migrate nextUserId
        Settings.findOne({nextUserId: {$exists: 1}}, function (err, legacyDoc) {
            if (err) { return cb(err); }
            if (!legacyDoc) {
                return cb(null, doc.nextId);
            }
            doc.nextId = legacyDoc.get('nextUserId') + 1;
            doc.save(function (err) {
                if (err) { return cb(err); }
                return cb(null, doc.nextId);
            })
        });

    });
};

var Settings = mongoose.model('Settings', settingsSchema);


module.exports = {
    SettingsModel: Settings
};