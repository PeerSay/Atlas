var should = require('chai').should();
//var _ = require('lodash');
var mongoose = require('mongoose');


// Mock config
var testConfig = {web: {}, db: {hash_iters: 100}, email: {enable: false}};
process.deploy = testConfig;
var config = require('../app/config');

// Dependencies to Mock
var errors = require('../app/errors');
var user = require('../app/models/users');
var User = user.UserModel;
var Settings = user.SettingsModel;
var Project = require('../app/models/projects').ProjectModel;

// --> Connect to test DB
var DB_URL = 'mongodb://localhost/peersay_test';
mongoose.connect(DB_URL/*, {server: {socketOptions: {keepAlive: 1}}}*/);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));


describe('Project Model', function () {
    var curUser = null;

    beforeEach(function (done) {
        // Ensure one entry exists
        var curUser = new User({name: 'me', email: 'some@email.com', password: '1'})
            .save(done);
    });

    afterEach(function (done) {
        User.remove({}, function () {
            Project.remove({}, done);
        });
        curUser = null;
        //done();
    });

    describe('CRUD', function () {

        it('should have project stub created by default', function (done) {
            User
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
            User
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
            User
                .findByEmail('some@email.com')
                .exec(function (err, user) {
                    should.not.exist(err);

                    user.createProject({
                        title: 'xyz'
                    }, function (err, prj) {
                        should.not.exist(err);
                        prj.should.have.property('title').equal('xyz');

                        User
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
            User
                .findByEmail('some@email.com')
                .exec(function (err, user) {
                    should.not.exist(err);

                    user.removeProject(1, function (err, prj) {
                        should.not.exist(err);

                        User
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
