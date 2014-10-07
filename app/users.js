var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


// Service model required for short incremental ids
//
var Settings = new Schema({
    nextUserId: { type: Number, default: 1 }
});
var SettingsModel = mongoose.model('Settings', Settings);
SettingsModel
    .findOneAndUpdate({}, {}, {upsert: true})
    .exec();


// Schema
//

var User = new Schema({
    id: Number,
    email: String,
    name: String
});

User.pre('save', function (next) {
    var doc = this;

    // unsure auto-increment of id
    SettingsModel.findOneAndUpdate({}, {$inc: {nextUserId: 1}}, function (err, settings) {
        if (err) next(err);
        doc.id = settings.nextUserId;

        next();
    });
});

// Model
//
var UserModel = mongoose.model('User', User);


module.exports = {
    UserModel: UserModel
};