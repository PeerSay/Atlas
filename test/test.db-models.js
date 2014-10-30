var should = require('chai').should();
//var _ = require('lodash');
var mongoose = require('mongoose');

var config = require('../app/config');
var user = require('../app/models/users');
var project = require('../app/models/projects');
var UserModel = user.UserModel;
var SettingsModel = user.SettingsModel;
var Project = project.ProjectModel;

// Connect to test DB
var DB_URL = 'mongodb://localhost/peersay_test';
mongoose.connect(DB_URL/*, {server: {socketOptions: {keepAlive: 1}}}*/);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));


describe('User Model', function () {

    beforeEach(function (done) {
        // Ensure initial id=1
        SettingsModel.remove().exec();
        SettingsModel.findOneAndUpdate({}, {}, {upsert: true}).exec();

        // Ensure one entry exists
        new UserModel({name: 'me', email: 'some@email.com', password: '1'})
            .save(done);

    });

    afterEach(function (done) {
        UserModel.remove({}, done);
    });

    describe('Basic CRUD', function () {

        it('should create new user with different email', function (done) {
            new UserModel({name: 'me2', email: 'some2@email.com', password: '1'})
                .save(function (err, doc) {
                    should.not.exist(err);
                    doc.should.be.an('object');
                    doc.should.have.property('id').equal(2); // next id=2
                    doc.should.have.property('email').equal('some2@email.com');
                    done();
                });
        });

        it('should validate email is unique', function (done) {
            new UserModel({name: 'me2', email: 'some@email.com', password: '1'})
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
            new UserModel({name: 'me2', password: '1'})
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

        it('should validate password is required', function (done) {
            new UserModel({name: 'me2', email: '1@1'})
                .save(function (err, doc) {
                    should.not.exist(doc);
                    err.should.be.an('object');
                    err.should.have.property('name').equal('ValidationError');

                    var key = Object.keys(err.errors)[0];
                    var error_msg = [key, err.errors[key].type].join(' ');
                    error_msg.should.be.equal('password required');
                    done();
                });
        });

        it('should find model by email', function (done) {
            UserModel.findByEmail('some@email.com', function (err, doc) {
                should.not.exist(err);
                doc.should.be.an('object');
                doc.should.have.property('email').equal('some@email.com');
                done();
            });
        });

        it('should not find model by wrong email', function (done) {
            UserModel.findByEmail('some2@email.com', function (err, doc) {
                should.not.exist(err); // nothing is ok
                should.not.exist(doc);
                done();
            });
        });
    });


    describe('Authentication', function () {

        it('should store password hashed', function (done) {
            UserModel.findByEmail('some@email.com', function (err, doc) {
                should.not.exist(err);
                doc.should.have.property('password').not.equal('1');
                done();
            });
        });

        it('should authenticate user with email/password', function (done) {
            UserModel.authenticate('some@email.com', '1', function (err, user, code) {
                should.not.exist(err);
                should.not.exist(code);
                user.should.be.an('object');
                done();
            });
        });

        it('should reject wrong email', function (done) {
            UserModel.authenticate('some2@email.com', '1', function (err, user, code) {
                should.not.exist(err);
                should.not.exist(user);
                code.should.be.equal(1); // NOT_FOUND
                done();
            });
        });

        it('should reject wrong password', function (done) {
            UserModel.authenticate('some@email.com', '2', function (err, user, code) {
                should.not.exist(err);
                should.not.exist(user);
                code.should.be.equal(2); // PWD_MISMATCH
                done();
            });
        });
    });

});


describe('Project Model', function () {
    var curUser = null;

    beforeEach(function (done) {
        // Ensure one entry exists
        var curUser = new UserModel({name: 'me', email: 'some@email.com', password: '1'})
            .save(done);
    });

    afterEach(function (done) {
        UserModel.remove({}, function () {
            Project.remove({}, done);
        });
        curUser = null;
        //done();
    });

    describe('CRUD', function () {

        it('should have project stub created by default', function (done) {
            UserModel
                .findByEmail('some@email.com')
                .exec(function (err, user) {
                    should.not.exist(err);

                    user.projects[0].should.be.an('object');
                    user.projects[0].should.have.property('id').equal(1);
                    user.projects[0].should.have.property('title').equal('Welcome Project'); // XXX
                    done();
                });
        });

        it('should populate full Project form stub, which has collaborator set', function (done) {
            UserModel
                .findByEmail('some@email.com')
                .populate('projects._ref')
                .exec(function (err, user) {
                    should.not.exist(err);
                    var project = user.projects[0];
                    project._ref.collaborators[0].should.be.deep.equal(user._id);
                    done();
                });
        });

        it('should create project by user', function (done) {
            UserModel
                .findByEmail('some@email.com')
                .exec(function (err, user) {
                    should.not.exist(err);

                    user.createProject({
                        title: 'xyz'
                    }, function (err, prj) {
                        should.not.exist(err);
                        prj.should.have.property('title').equal('xyz');

                        UserModel
                            .findByEmail(user.email)
                            .populate('projects._ref')
                            .exec(function (err, user) {
                                should.not.exist(err);

                                var project = user.projects[1];
                                project.should.have.property('id').equal(2);
                                project._ref.collaborators[0].should.be.deep.equal(user._id);
                                done();
                            });
                    });
                });
        });

        it('should remove project by id', function (done) {
            UserModel
                .findByEmail('some@email.com')
                .exec(function (err, user) {
                    should.not.exist(err);

                    user.removeProject(1, function (err, prj) {
                        should.not.exist(err);

                        UserModel
                            .findByEmail(user.email)
                            .populate('projects._ref')
                            .exec(function (err, user) {
                                should.not.exist(err);
                                should.not.exist(user.projects[1]);
                                done();
                            });
                    });
                });
        });

    });
});