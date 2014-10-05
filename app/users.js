var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var Settings = new Schema({
    nextUserId: { type: Number, default: 1 }
});
var SettingsModel = mongoose.model('Settings', Settings);
SettingsModel
    .findOneAndUpdate({}, {}, {upsert: true})
    .exec();

// Schemas
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

/*var usr1 = new UserModel({name: 'Ppp', email: '1@2.com'});
usr1.save(function (err) {
    if (err) return console.error(err);

    UserModel.find(function (err, users) {
        if (err) return console.error(err);
        //console.log(users);
    });
});*/


module.exports = {
    UserModel: UserModel
};