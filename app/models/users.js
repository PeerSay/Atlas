var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var util = require('../../app/util');
var config = require('../../app/config');
var Project = require('../../app/models/projects').ProjectModel;

// Need few iterations for fast tests, thus it is configurable
var HASH_ITERS = config.db.hash_iters || 100000;


// Service model required for short incremental ids
//
var settingsSchema = new Schema({
    nextUserId: { type: Number, default: 1 }
});
var Settings = mongoose.model('Settings', settingsSchema);
Settings
    .findOneAndUpdate({}, {}, {upsert: true})
    .exec();


// Schemas
//

var projectStubSchema = new Schema({
    id: { type: Number },
    title: { type: String, required: true },
    _ref: { type: Schema.ObjectId, ref: 'Project' }
});

var userSchema = new Schema({
    id: { type: Number, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String},
    projects: [ projectStubSchema ]
});


userSchema.statics.findByEmail = function (email, cb) {
    return this.findOne({email: email}, cb);
};


userSchema.statics.authenticate = function (email, password, cb) {
    var code = {
        NOT_FOUND: 1,
        PWD_MISMATCH: 2
    };

    this.findOne({email: email}, 'id email password -_id', function (err, user) {
        if (err) return cb(err);

        if (!user) {
            return cb(null, null, code.NOT_FOUND);
        }

        var verify = split(user.password);
        util.hasher({plaintext: password, salt: verify.salt, iterations: HASH_ITERS}, function (err, result) {
            if (err) return cb(err);

            var hash = result.key.toString('hex');
            if (hash !== verify.hash) {
                return cb(null, null, code.PWD_MISMATCH);
            }

            var ret = {
                id: user.id,
                email: user.email
            };
            return cb(null, ret);
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


userSchema.methods.createProject = function (project, cb) {
    var $user = this;
    Project.createByUser(project, $user, function (err, stubPrj) {
        if (err) return cb(err);

        $user.save(function (err, user) {
            if (err) return cb(err);
            cb(null, stubPrj); // stub is enough for create
        });
    });
};


userSchema.methods.removeProject = function (stub_id, cb) {
    var $user = this;
    Project.removeByUser(stub_id, $user, function (err) {
        if (err) return cb(err);

        $user.save(function (err) {
            if (err) return cb(err);
            cb(null, {
                id: stub_id,
                removed: true
            });
        });
    });
};


userSchema.pre('save', function ensurePassword(next) {
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


userSchema.pre('save', function ensureId(next) {
    var user = this;

    if (!user.isNew) { return next(); }

    // unsure auto-increment of id
    Settings.findOneAndUpdate({}, {$inc: {nextUserId: 1}}, function (err, settings) {
        if (err) next(err);
        user.id = settings.nextUserId;

        next();
    });
});


userSchema.pre('save', function ensureProject(next) {
    var $user = this;

    if (!$user.isNew) { return next(); }

    Project.createByUser(null/*default*/, $user, function (err) {
        if (err) next(err);
        next();
    });
});

// Model
//
var User = mongoose.model('User', userSchema);


module.exports = {
    SettingsModel: Settings,
    UserModel: User
};