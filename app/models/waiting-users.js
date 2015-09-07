/**
 * Created by Tal on 2/2/2015.
 */
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var codes = require(appRoot + '/app/web/codes');

// Schemas
//
var waitingUserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String },
    organization: { type: String },
    organizationSizeIndustry: { type: String },
    location: { type: String },
    inputOnProducts: { type: String },
    inputOnRequirements: { type: String }
});

waitingUserSchema.statics.findByEmail = function (email, cb) {
    return this.findOne({email: email}, cb);
};

waitingUserSchema.statics.add = function (email, data, cb) {
    this.findOne({email: email}, function (err, user) {
        if (err) { return cb(err); }

        if (user) { // user already registered

            // Update as it may have more/changed data from new WaitingUsers form
            _.extend(user, data);

            return user.save(function (eer, user) {
                if (err) { return cb(err); }

                return cb(null, user, codes.WAITING_DUPLICATE);
            });
        }

        // new registration - create new waiting user
        WaitingUser.create(data, function (err, user) {
            if (err) { return cb(err); }

            return cb(null, user, codes.WAITING_NEW_OK);
        });
    });
};


// Model
//
var WaitingUser = mongoose.model('WaitingUser', waitingUserSchema);

module.exports = {
    WaitingUserModel: WaitingUser
};