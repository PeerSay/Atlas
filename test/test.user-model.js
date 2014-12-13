var should = require('chai').should();
var mongoose = require('mongoose');

// Mock config
process.deploy = {web: {}, db: {hash_iters: 100}, email: {enable: false}};
var config = require('../app/config');

// Dependencies to Mock
var errors = require('../app/errors');
var user = require('../app/models/users');
var User = user.UserModel;
var Settings = user.SettingsModel;

// --> Connect to test DB
var DB_URL = 'mongodb://localhost/peersay_test';
mongoose.connection.on('error', console.error.bind(console, 'connection error in user-model:'));


describe('User Model', function () {
    before(function (done) {
        mongoose.connect(DB_URL, done);
    });
    after(function (done) {
        mongoose.connection.db.dropDatabase(function(){
            mongoose.connection.close(function(){
                done();
            });
        });
    });


    describe('Registration', function () {
        before(function (done) {
            // Ensure initial id=1
            Settings.remove().exec();
            Settings.findOneAndUpdate({}, {}, {upsert: true}).exec();
            // Ensure one verified User exists
            User.create({name: 'me', email: 'some@email.com', password: '1', needVerify: false}, done);
        });
        after(function (done) {
            User.remove({}, done);
        });

        it('should store password hashed', function (done) {
            User.findByEmail('some@email.com', function (err, doc) {
                should.not.exist(err);
                doc.should.have.property('password').not.equal('1');
                done();
            });
        });

        it('User.register should create verified user (LinkedIn)', function (done) {
            var data = {
                email: 'some2@email.com',
                password: '1',
                needVerify: false
            };
            User.register(data.email, data.password, data, function (err, doc, code) {
                should.not.exist(err);
                code.should.be.equal(errors.AUTH_NEW_OK);
                doc.should.be.an('object');
                doc.should.have.property('id').equal(2); // next id=2
                doc.should.have.property('email').equal('some2@email.com');
                doc.should.have.property('needVerify').equal(false);
                done();
            });
        });

        it('User.register should authorize verified user on 2nd attempt (LinkedIn)', function (done) {
            var data = {
                email: 'some2@email.com',
                password: '1',
                needVerify: false
            };
            User.register(data.email, data.password, data, function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(code);

                doc.should.be.an('object');
                doc.should.have.property('id').equal(2); // same id
                doc.should.have.property('email').equal('some2@email.com');
                doc.should.have.property('needVerify').equal(false);
                done();
            });
        });

        it('User.register should create unverified user (local)', function (done) {
            var data = {
                email: 'some3@email.com',
                password: '1',
                needVerify: true
            };
            User.register(data.email, data.password, data, function (err, doc, code) {
                should.not.exist(err);
                code.should.be.equal(errors.AUTH_NEW_OK);
                doc.should.be.an('object');
                doc.should.have.property('email').equal('some3@email.com');
                doc.should.have.property('needVerify').length(88);
                done();
            });
        });

        it('User.register should update password/verify-key for 2nd attempt of unverified user (local)', function (done) {
            var data = {
                email: 'some3@email.com',
                password: '2',
                needVerify: true
            };
            User.findByEmail('some3@email.com', function (err, user) {
                var origPassword = user.password;
                var origKey = user.needVerify;
                User.register(data.email, data.password, data, function (err, doc, code) {
                    should.not.exist(err);
                    doc.should.be.an('object');
                    doc.should.have.property('email').equal('some3@email.com');
                    doc.should.have.property('password').not.length(origPassword);
                    doc.should.have.property('needVerify').not.equal(origKey);
                    done();
                });
            });
        });

        it('User.register should validate email is unique (if pwd mismatch)', function (done) {
            var data = {name: 'me', email: 'some@email.com', password: '2'};
            User.register(data.email, data.password, data, function (err, doc, code) {
                should.not.exist(doc);
                should.not.exist(err);
                code.should.be.equal(errors.AUTH_DUPLICATE);
                done();
            });
        });
    });

    describe('Email verification', function () {
        var verifyKey;
        before(function (done) {
            var data = {
                email: 'some@email.com',
                password: '1',
                needVerify: true
            };
            User.register(data.email, data.password, data, function (err, doc) {
                verifyKey = doc.needVerify;
                done();
            });
        });
        after(function (done) {
            User.remove({}, done);
        });

        it('User.verifyAccount should check that user email is registered', function (done) {
            User.verifyAccount('someNOT@email.com', 'xxx', function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(doc);
                code.should.be.equal(errors.AUTH_NOT_FOUND);
                done();
            });
        });

        it('User.verifyAccount should *not* verify on wrong verify key', function (done) {
            User.verifyAccount('some@email.com', 'xxx', function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(doc);
                code.should.be.equal(errors.AUTH_NOT_VERIFIED);
                done();
            });
        });

        it('User.verifyAccount should verify on good verify key', function (done) {
            User.verifyAccount('some@email.com', verifyKey, function (err, doc, code) {
                should.not.exist(err);

                doc.should.be.an('object');
                doc.should.have.property('email').equal('some@email.com');
                doc.should.have.property('needVerify').equal(false);
                done();
            });
        });
    });

    describe('Authentication', function () {
        before(function (done) {
            User.create({name: 'me', email: 'some@email.com', password: '1', needVerify: true}, function () {
                User.create({name: 'me', email: 'some2@email.com', password: '2', needVerify: false}, done);
            });
        });
        after(function (done) {
            User.remove({}, done);
        });

        it('User.authenticate should authenticate user with good email/password', function (done) {
            User.authenticate('some2@email.com', '2', function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(code);
                doc.should.be.an('object');
                doc.should.have.property('email').equal('some2@email.com');
                done();
            });
        });

        it('User.authenticate should reject user with wrong email', function (done) {
            User.authenticate('some3@email.com', '1', function (err, user, code) {
                should.not.exist(err);
                should.not.exist(user);
                code.should.be.equal(errors.AUTH_NOT_FOUND);
                done();
            });
        });

        it('User.authenticate should reject user with wrong password', function (done) {
            User.authenticate('some2@email.com', '3', function (err, user, code) {
                should.not.exist(err);
                should.not.exist(user);
                code.should.be.equal(errors.AUTH_PWD_MISMATCH);
                done();
            });
        });

        it('User.authenticate should reject unverified user', function (done) {
            User.authenticate('some@email.com', '1', function (err, user, code) {
                should.not.exist(err);
                //should.not.exist(user); // returned - OK?
                code.should.be.equal(errors.AUTH_NOT_VERIFIED);
                done();
            });
        });
    });

    describe.skip('Update password', function () {
        var origPassword;
        before(function (done) {
            User.create({name: 'me', email: 'some@email.com', password: '1', needVerify: true}, function (err, user) {
                origPassword = user.password;
                done();
            });
        });
        after(function (done) {
            User.remove({}, done);
        });

        it('User.updatePassword should check that user email is registered', function (done) {
            User.updatePassword('some2@email.com', '1', function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(doc);
                code.should.be.equal(errors.AUTH_NOT_FOUND);
                done();
            });
        });

        it('User.updatePassword should update password and verify acc', function (done) {
            User.updatePassword('some@email.com', '2', function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(code);

                doc.should.be.an('object');
                doc.should.have.property('email').equal('some@email.com');
                doc.should.have.property('password').not.equal(origPassword);
                doc.should.have.property('needVerify').equal(false);
                done();
            });
        });

        it('should authenticate ok after update password', function (done) {
            User.authenticate('some@email.com', '2', function (err, doc, code) {
                should.not.exist(err);
                should.not.exist(code);

                doc.should.be.an('object');
                doc.should.have.property('email').equal('some@email.com');
                done();
            });
        });
    });
});
