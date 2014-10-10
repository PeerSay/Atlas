var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var ObjectId = Schema.ObjectId;
var util = require('../app/util');
var config = require('../app/config');

// Need few iterations for fast tests, thus it is configurable
var HASH_ITERS = config.db.hash_iters || 100000;


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
    id: {type: Number, unique: true},
    email: {type: String, required: true, unique: true },
    password: {type: String, required: true},
    name: String
});


User.statics.findByEmail = function (email, cb) {
    return this.findOne({email: email}, cb);
};


User.statics.authenticate = function (email, password, cb) {
    var code = {
        NOT_FOUND: 1,
        PWD_MISMATCH: 2
    };

    this.findByEmail(email, function (err, user) {
        if (err) return cb(err);

        if (!user) {
            console.log('Failed to find: %s', email);
            return cb(null, null, code.NOT_FOUND);
        }

        var verify = split(user.password);
        util.hasher({plaintext: password, salt: verify.salt, iterations: HASH_ITERS}, function (err, result) {
            if (err) return cb(err);

            var hash = result.key.toString('hex');
            if (hash !== verify.hash) {
                return cb(null, null, code.PWD_MISMATCH);
            }

            return cb(null, user);
        });
    });


    function split(joined) {
        var arr = joined.split('_');
        return {
            hash: arr[0],
            salt: new Buffer(arr[1], 'hex')
        };
    }
};


User.pre('save', function (next) {
    var user = this;

    // do not re-hash password if not modified or new
    if (!user.isModified('password')) { return next(); }

    // hash the password
    util.hasher({plaintext: user.password, iterations: HASH_ITERS}, function (err, result) {
        if (err) return next(err);

        // override the plaintext password with the hashed one + salt
        user.password = [result.key.toString('hex'), result.salt.toString('hex')].join('_');
        next();
    });
});


User.pre('save', function (next) {
    var user = this;

    // unsure auto-increment of id
    SettingsModel.findOneAndUpdate({}, {$inc: {nextUserId: 1}}, function (err, settings) {
        if (err) next(err);
        user.id = settings.nextUserId;

        next();
    });
});

// Model
//
var UserModel = mongoose.model('User', User);


module.exports = {
    SettingsModel: SettingsModel,
    UserModel: UserModel
};