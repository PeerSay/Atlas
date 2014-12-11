var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var passport = require('passport');
var request = require('supertest');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
chai.should();
chai.use(sinonChai);


// Dependencies
var app = express();
app.use(cookieParser());
app.use(session({
    secret: 'some cat',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
var agent = request.agent(app);

// Mock config
var testConfig = {web: {}, db: {}, email: {enable: false}};
process.deploy = testConfig;
var config = require('../app/config');

// Dependencies to Mock
var util = require('../app/util');
var mailer = require('../app/email/mailer');
var User = require('../app/models/users').UserModel;

// --> Under test
var Auth = require('../app/auth');
var auth = Auth(app).setupRoutes();


describe('Auth', function () {

    describe('Auth operations', function () {
        it('should return 409 if no email is passed');
        it('should return 409 if no password is passed');

        it.skip('should resister new user on POST /auth/signup', function (done) {
            /* var mock = sinon.mock(models.User);
             mock.expects("register").once().returns(42);

             console.log(models.User);
             models.User.register();
             mock.verify();*/

            /*request(app)
             .post('/auth/signup', {email: 'a@a', password: '123123'})
             .expect(200, done)
             .expect(function (res) {
             mock.verify();
             if (res.body.result == null) return 'Wrong result: ' + res.body.result;
             });*/

        });

        it('should redirect to /auth/signup/success upon register');
        it('should send activation email upon register');

        it('should not activate account upon GET to incorrect activation link');
        it('should not redirect to /auth/signup/verified?err upon failed activation');

        it('should activate account upon GET to correct activation link');
        it('should redirect to /projects upon successful login after activation');
    });

    describe('Password Restore', function () {
        var mailerStub = sinon.stub(mailer, 'send');
        var utilStub = sinon.stub(util, 'genRestorePwdKey').returns('123');
        var userFindOneStub = sinon.stub(User, 'findOne')
            .withArgs({email: 'a@a'})
            .callsArgWith(2, null, {email: 'a@a'});

        it('should set session cookie on POST /api/auth/restore and return success json', function (done) {
            request(app)
                .post('/api/auth/restore')
                .send({email: 'a@a'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect({result: true})
                .expect('set-cookie', /connect\.sid/)
                .expect('set-cookie', /Expires/, done);
        });

        it('should send restore-pwd email with restore key on POST /api/auth/restore', function (done) {
            mailerStub
                .withArgs('a@a', 'restore-pwd', {code: '123'})
                .calledOnce.should.equal(true);

            agent
                .post('/api/auth/restore')
                .send({email: 'a@a'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200, done);
        });

        it('should fail complete restore with invalid code on POST /api/auth/restore/complete', function (done) {
            agent
                .post('/api/auth/restore/complete')
                .send({code: '1234', password: 'xxx'}) // <--
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect({error: 'invalid code'}, done);
        });

        it('should complete restore on valid POST /api/auth/restore/complete and update user password', function (done) {
            sinon.stub(User, 'updatePassword')
                .withArgs('a@a', 'xyz')
                .callsArgWith(2, null, {email: 'a@a', id: 1});

            agent
                .post('/api/auth/restore/complete')
                .send({code: '123', password: 'xyz'}) // <--
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect({result: {email: 'a@a', id: 1}}, done);
        });

        it('should fail restore begin on POST /api/auth/restore if user is not found by email', function (done) {
            User.findOne.restore();
            sinon.stub(User, 'findOne')
                .withArgs({email: 'a@a'})
                .callsArgWith(2, null, null); //<--

            request(app)
                .post('/api/auth/restore')
                .send({email: 'a@a'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect({error: 'not found: a@a'}, done)
        });

        it('should fail restore begin on POST /api/auth/restore if user is linkedIn', function (done) {
            User.findOne.restore();
            sinon.stub(User, 'findOne')
                .withArgs({email: 'a@a'})
                .callsArgWith(2, null, {linkedIn: true}); //<--

            request(app)
                .post('/api/auth/restore')
                .send({email: 'a@a'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect({error: 'linkedin'}, done)
        });

        it('should fail restore if session not started or expired on POST /api/auth/restore/complete', function (done) {
            request(app)
                .post('/api/auth/restore/complete')
                .send({code: '123'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(200)
                .expect({error: 'no session'}, done);
        });
    });
});
