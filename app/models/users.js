var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var util = require('../../app/util');
var config = require('../../app/config');
var Project = require('../../app/models/projects').ProjectModel;

// Need few iterations for fast tests, thus it is configurable
var HASH_ITERS = config.db.hash_iters || 100000; // TODO - test
var errors = require('../../app/errors');


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
    name: {
        familyName: String,
        givenName: String
    },
    linkedIn: { type: Boolean, default: false },
    needVerify: { type: Schema.Types.Mixed }, // false or 'uid'
    projects: [ projectStubSchema ]
});


userSchema.virtual('name.full').get(function () {
    return (this.name.givenName + ' ' + this.name.familyName).trim();
});


userSchema.statics.findByEmail = function (email, cb) {
    return this.findOne({email: email}, cb);
};


userSchema.statics.authenticate = function (email, password, cb) {
    this.findOne({email: email}, function (err, user) {
        if (err) { return cb(err); }

        if (!user) {
            return cb(null, null, errors.AUTH_NOT_FOUND);
        }

        if (user.needVerify !== false) {
            return cb(null, user, errors.AUTH_NOT_VERIFIED);
        }

        var verify = split(user.password);
        util.hasher({plaintext: password, salt: verify.salt, iterations: HASH_ITERS}, function (err, result) {
            if (err) { return cb(err); }

            var hash = result.key.toString('hex');
            if (hash !== verify.hash) {
                return cb(null, null, errors.AUTH_PWD_MISMATCH);
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


userSchema.statics.register = function (email, password, user_data, cb) {
    User.authenticate(email, password, function (err, user, code) {
        if (err) { return cb(err); }

        if (code === errors.AUTH_NOT_VERIFIED) {
            // user exists but not verified -> the best thing we can do is update pwd and re-send email
            // otherwise it would lead to DOS - attacker could create accounts without having email,
            // thus blocking actual owners' access
            user.password = password;
            user.needVerify = true;
            return user.save(function (err, userUpd) {
                if (err) { return cb(err); }

                cb(null, userUpd);
            });
        }

        if (code === errors.AUTH_PWD_MISMATCH) {
            // user exists, verified but has different password -> show 'already registered'
            return cb(null, null, errors.AUTH_DUPLICATE);
        }

        if (user) {
            // user exists & password match, may be LinkedIn login/signup or just full match
            // anyway -> authorize user
            return cb(null, user);
        }

        User.create(user_data, function (err, user) {
            if (err) { return cb(err); }
            return cb(null, user, errors.AUTH_NEW_OK);
        })
    });
};


userSchema.statics.verifyAccount = function (email, uid, cb) {
    User.findOne({email: email}, function (err, user) {
        if (err) { return cb(err); }

        if (!user) {
            return cb(null, null, errors.AUTH_NOT_FOUND);
        }

        if (user.needVerify === false) {
            // Already verified, e.g. by LinkedIn or Pwd restore
            return cb(null, user);
        }

        if (user.needVerify !== uid) {
            // Probably bad url copy-paste or something really bad..
            return cb(null, null, errors.AUTH_NOT_VERIFIED);
        }

        user.needVerify = false;
        user.save(function (err, verifiedUser) {
            if (err) { return cb(err); }
            cb(null, verifiedUser);
        });
    });
};

userSchema.statics.updatePassword = function (email, password, cb) {
    // Cannot use findOneAndUpdate, where/update etc. - it doesn't call 'pre' hooks
    User.findOne({email: email}, function (err, user) {
        if (err) { return cb(err); }

        if (!user) {
            return cb(null, null, errors.AUTH_NOT_FOUND);
        }

        // This is sort of account validation too, as user can get valid code only from inbox
        user.needVerify = false;
        user.password = password;
        user.save(function (err, updatedUser) {
            if (err) { return cb(err); }
            cb(null, updatedUser);
        });
    });
};


userSchema.methods.createProject = function (project, cb) {
    var user = this;
    Project.createByUser(project, user, function (err, stubPrj) {
        if (err) return cb(err);

        user.save(function (err, user) {
            if (err) { return cb(err); }
            cb(null, stubPrj); // stub is enough for create
        });
    });
};


userSchema.methods.removeProject = function (stub_id, cb) {
    var user = this;
    Project.removeByUser(stub_id, user, function (err) {
        if (err) { return cb(err); }

        user.save(function (err) {
            if (err) { return cb(err); }

            cb(null, {
                id: stub_id,
                removed: true
            });
        });
    });
};


userSchema.pre('save', function ensureId(next) {
    var user = this;
    if (!user.isNew) { return next(); }

    // ensure auto-increment of user.id
    Settings.findOneAndUpdate({}, {$inc: {nextUserId: 1}}, function (err, settings) {
        if (err) next(err);
        user.id = settings.nextUserId;

        next();
    });
});


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


userSchema.pre('save', function ensureValidEmail(next) {
    var user = this;

    // set to true when need to generate uid and send email
    if (!user.isModified('needVerify')) { return next(); }

    // No need to verify for LinkedIn; false means verification complete
    if (user.linkedIn || user.needVerify === false) { return next(); }

    util.randomBase64(64, function (err, str) {
        if (err) return next(err);

        user.needVerify = str;
        user.markModified('needVerify'); // BUG: doesn't work?
        next();
    });
});


userSchema.pre('save', function ensureProject(next) {
    var user = this;
    if (!user.isNew) { return next(); }

    Project.createByUser(null/*default*/, user, function (err) {
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