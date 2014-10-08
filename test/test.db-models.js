var should = require('chai').should();
//var _ = require('lodash');
var mongoose = require('mongoose');

var config = require('../app/config');
var db = require('../app/users');
var UserModel = db.UserModel;
var SettingsModel = db.SettingsModel;

// Connect to test DB
mongoose.connect(config.db.test_url/*, {server: {socketOptions: {keepAlive: 1}}}*/);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));


describe('Users Model', function () {

    describe('User validation', function () {

        beforeEach(function (done) {
            // Ensure initial id=1
            SettingsModel.remove().exec();
            SettingsModel.findOneAndUpdate({}, {}, {upsert: true}).exec();

            // Ensure one entry exists
            new UserModel({name: 'me', email: 'some@email.com'})
                .save(done);
        });

        afterEach(function (done) {
            UserModel.remove({}, done);
        });

        it('should create new user with different email', function (done) {
            new UserModel({name: 'me2', email: 'some2@email.com'})
                .save(function (err, doc) {
                    should.not.exist(err);
                    doc.should.be.an('object');
                    doc.should.have.property('id').equal(2); // next id=2
                    doc.should.have.property('email').equal('some2@email.com');
                    done();
                });
        });

        it('should validate email is unique', function (done) {
            new UserModel({name: 'me2', email: 'some@email.com'})
                .save(function (err, doc) {
                    should.not.exist(doc);
                    err.should.be.an('object');
                    err.should.have.property('name').equal('MongoError');
                    err.should.have.property('code').equal(11000);
                    var error_msg = /dup key:.*"(.*?)"/.exec(err.err);
                    error_msg = [error_msg[1], 'exists'].join(' ');
                    error_msg.should.be.equal('some@email.com exists');
                    done();
                });
        });

        it('should validate email is required', function (done) {
            new UserModel({name: 'me2'})
                .save(function (err, doc) {
                    should.not.exist(doc);
                    err.should.be.an('object');
                    err.should.have.property('name').equal('ValidationError');

                    var key = Object.keys(err.errors)[0];
                    var error_msg = [key, err.errors[key].type].join(' ');
                    error_msg.should.be.equal('email required');
                    done();
                });
        });
    });

});
