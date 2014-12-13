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
var Project = require('../app/models/projects').ProjectModel;

// --> Connect to test DB
var DB_URL = 'mongodb://localhost/peersay_test';
mongoose.connection.on('error', console.error.bind(console, 'connection error in project-model:'));


describe('Project Model', function () {
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


    describe('CRUD', function () {
        var firstProjectId;

        before(function (done) {
            // Ensure initial id=1
            Settings.remove().exec();
            Settings.findOneAndUpdate({}, {}, {upsert: true}).exec();

            //ensure user registered
            var data = {
                email: 'some@email.com',
                password: '1',
                needVerify: false
            };
            User.register(data.email, data.password, data, function (err, doc) {
                firstProjectId = doc.projects[0]._ref;
                done();
            });
        });
        after(function (done) {
            User.remove({}, function () {
                Project.remove({}, done);
            });
        });

        it('User should have project stub created by default', function (done) {
            var userQ = User.findByEmail('some@email.com');
            userQ.exec(function (err, user) {
                should.not.exist(err);
                user.projects.should.be.an('array');

                var stubPrj = user.projects[0];
                stubPrj.should.be.an('object');
                stubPrj.should.have.property('_ref').be.a('string');
                stubPrj.should.have.property('_stub').equal(true);
                stubPrj.should.have.property('title').equal('Welcome Project');
                done();
            });
        });

        it('User should populate full Project form stub, which has collaborator set', function (done) {
            var userQ = User.findByEmail('some@email.com');
            userQ
                .populate('projects._ref') // <--
                .exec(function (err, user) {
                    should.not.exist(err);

                    var project = user.projects[0]._ref;
                    project.title.should.be.equal('Welcome Project');
                    project.collaborators[0].should.be.deep.equal(user._id);
                    project.criteria.should.be.an('array');
                    done();
                });
        });

        it('Project should create new project by user and population should work', function (done) {
            var userQ = User.findByEmail('some@email.com');
            userQ.exec(function (err, user) {
                Project.createByUser({ title: 'xyz' }, user, function (err, prjStub) {
                    should.not.exist(err);
                    prjStub.should.have.property('title').equal('xyz');

                    userQ
                        .populate('projects._ref')
                        .exec(function (err, popUser) {
                            should.not.exist(err);

                            var project = popUser.projects[1]._ref; // 2nd project for this user
                            project.title.should.be.equal('xyz');
                            project.collaborators[0].should.be.deep.equal(popUser._id);
                            project.criteria.should.be.an('array');
                            done();
                        });
                });
            });
        });

        it('Project should remove project by user', function (done) {
            var userQ = User.findByEmail('some@email.com');
            userQ.exec(function (err, user) {
                Project.removeByUser(firstProjectId, user, function (err/*, prj*/) {
                    should.not.exist(err);

                    userQ
                        .populate('projects._ref')
                        .exec(function (err, popUser) {
                            should.not.exist(err);
                            should.not.exist(popUser.projects[1]);
                            done();
                        });
                });
            });
        });

        it('Project should be removed from collaborators stubs as well');
    });
});
