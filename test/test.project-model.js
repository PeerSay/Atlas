var _ = require('lodash');
var should = require('chai').should();
var mongoose = require('mongoose');


// Mock config
process.deploy = {web: {}, db: {hash_iters: 100}, email: {enable: false}};
var config = require(appRoot + '/app/config');

// Models under test
var Settings = require(appRoot + '/app/models/settings').SettingsModel;
var Users = require(appRoot + '/app/models/users').UserModel;
var Projects = require(appRoot + '/app/models/projects').ProjectModel;


// --> Connect to test DB
var DB_URL = 'mongodb://localhost/peersay_test';
mongoose.connection.on('error', console.error.bind(console, 'connection error in project-model:'));


describe('Project Model', function () {
    before(function (done) {
        mongoose.connect(DB_URL, done);
    });
    after(function (done) {
        mongoose.connection.db.dropDatabase(function () {
            mongoose.connection.close(function () {
                done();
            });
        });
    });


    describe.only('CRUD', function () {
        var userQ, userM;
        var defUserData = {
            email: 'some@email.com',
            password: '1',
            needVerify: false
        };
        var defProjectData = {category: '123'};
        var defProjectId;

        beforeEach(function (done) {
            // def user
            Users.register(defUserData.email, defUserData.password, defUserData, function (err, doc) {
                userM = doc;
                userQ = Users.findByEmail('some@email.com');

                // def project
                Projects.createByUser(defProjectData, userM, function (err, prjStub) {
                    defProjectId = prjStub._ref;
                    done();
                });
            });
        });
        afterEach(function (done) {
            Users.remove({}, function () {
                Projects.remove({}, done);
            });
        });

        it('createByUser should create new Project and return project stub', function (done) {
            var projectData = {category: 'xyz'};

            Projects.createByUser(projectData, userM, function (err, prjStub) {
                should.not.exist(err);
                prjStub.should.have.property('title').equal('xyz');

                done();
            });
        });

        it('createByUser should add project stub to User', function (done) {
            var projectData = {category: 'abc'};

            Projects.createByUser(projectData, userM, function (err, prjStub) {
                should.not.exist(err);

                userQ
                    .populate('projects._ref')
                    .exec(function (err, user) {
                        should.not.exist(err);

                        var projectStub = _.find(user.projects, {title: prjStub.title});
                        var project = projectStub._ref; //populated model

                        project.selectedCategory.should.be.equal('abc');
                        project.title.should.be.equal('abc'); // title == category
                        project.collaborators[0].should.be.deep.equal(user._id);
                        done();
                    });
            });
        });

        it('createByUser should add custom category to Project.categories list', function (done) {
            var projectData = {
                category: 'xxx',
                customCategory: true
            };

            Projects.createByUser(projectData, userM, function (err, prjStub) {
                should.not.exist(err);

                userQ
                    .populate('projects._ref')
                    .exec(function (err, user) {
                        should.not.exist(err);

                        var projectStub = _.find(user.projects, {title: prjStub.title});
                        var project = projectStub._ref; //populated model
                        var category = project.categories[0];

                        should.exist(category);
                        category.custom.should.be.equal(true);
                        category.name.should.be.equal('xxx');
                        done();
                    });

            });
        });

        it('removeByUser should remove project by projectId', function (done) {

            Projects.removeByUser(defProjectId, userM, function (err/*, prj*/) {
                should.not.exist(err);

                Projects.findById(defProjectId, function (err, prj) {
                    should.not.exist(err);
                    should.not.exist(prj);

                    done();
                });
            });
        });

        it('removeByUser should remove stub from User', function (done) {

            Projects.removeByUser(defProjectId, userM, function (err/*, prj*/) {
                should.not.exist(err);

                userQ
                    .populate('projects._ref')
                    .exec(function (err, user) {
                        should.not.exist(err);
                        user.projects.should.have.length(0);

                        done();
                    });
            });
        });

        it('removeByUser should return null on invalid projectId', function (done) {
            var notExistingId = 'abcd';

            Projects.removeByUser(notExistingId, userM, function (err, doc) {
                should.not.exist(err);
                should.not.exist(doc);
                done();
            });
        });

        it('Project should be removed from collaborators stubs as well');
        it('Projects resources (files etc) should be removed too');
    });
});
