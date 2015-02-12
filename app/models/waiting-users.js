/**
 * Created by Tal on 2/2/2015.
 */
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var errors = require('../../app/errors');

// Schemas
//

var waitingUserSchema = new Schema({
    email: { type: String, required: true, unique: true }
});

waitingUserSchema.statics.findByEmail = function (email, cb) {
    return this.findOne({email: email}, cb);
};

waitingUserSchema.statics.add = function (email, data, cb) {
    this.findOne({email: email}, function (err, user) {
        if (err) { return cb(err); }

        if (user) { // user already registered
            return cb(null, user, errors.WAITING_DUPLICATE);
        }

        // new registration - create new waiting user
        WaitingUser.create(data, function (err, user) {
            if (err) { return cb(err); }

            return cb(null, user, errors.WAITING_NEW_OK);
        });
    });
};


// Model
//
var WaitingUser = mongoose.model('WaitingUser', waitingUserSchema);

module.exports = {
    WaitingUserModel: WaitingUser
};