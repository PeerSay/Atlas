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
var errors = require('../app/errors');
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

var companyEmail = 'PeerSay Team <team@peer-say.com>';

// Mock config
process.deploy = {web: {}, db: {hash_iters: 100}, auth: {linkedin : {api_key: 'x', secret_key: 'x'}}, email: {enable: false, auth: {}}};
var config = require('../app/config');

// Dependencies to Mock
var util = require('../app/util');
var mailer = require('../app/email/mailer');
var User = require('../app/models/users').UserModel;

// --> Under test
var Auth = require('../app/auth');
var auth = Auth(app).setupRoutes();


describe('Auth', function () {
    var typeAcceptHeaders = {'Content-Type':  'application/json', 'Accept': 'application/json'};

    describe('Login - local', function () {
        var userAuthenticateStub;

        before(function () {
            userAuthenticateStub = sinon.stub(User, 'authenticate')
                .withArgs('a@a', '123123')
                .callsArgWith(2, null, {email: 'a@a'});
        });
        after(function () {
            User.authenticate.restore();
        });


        it('should set session cookie on POST /api/auth/login and return success json', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({email: 'a@a', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({ result: true })
                .expect('set-cookie', /connect\.sid/, done);
        });

        it('should fail login with invalid email on POST /api/auth/login', function (done) {
            User.authenticate.restore();
            sinon.stub(User, 'authenticate')
                .withArgs('b@b', '123123')
                .callsArgWith(2, null, null, errors.AUTH_NOT_FOUND); //<--

            request(app)
                .post('/api/auth/login')
                .send({email: 'b@b', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({error: 'Wrong email or password'}, done);
        });

        it('should fail login with invalid password on POST /api/auth/login', function (done) {
            User.authenticate.restore();
            sinon.stub(User, 'authenticate')
                .withArgs('b@b', '123123')
                .callsArgWith(2, null, null, errors.AUTH_PWD_MISMATCH); //<--

            request(app)
                .post('/api/auth/login')
                .send({email: 'b@b', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({error: 'Wrong email or password'}, done);
        });

        it('should fail login with unverified email on POST /api/auth/login & re-send email', function (done) {
            User.authenticate.restore();
            sinon.stub(User, 'authenticate')
                .withArgs('b@b', '123123')
                .callsArgWith(2, null, {email: 'b@b', name: {full: 'John Snow'}}, errors.AUTH_NOT_VERIFIED); //<--

            // TODO - doesn't work!
            /*sinon.stub(mailer, 'send')
                .withArgs('b@b')
                .calledOnce.should.equal(true);*/

            request(app)
                .post('/api/auth/login')
                .send({email: 'b@b', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({error: 'verify-email'}, done);
        });

        it('should handle longSession param on POST /api/auth/login');
    });

    describe('Signup - local', function () {
        var userRegisterStub;

        before(function () {
            userRegisterStub = sinon.stub(User, 'register')
                .withArgs('a@a', '123123')
                .callsArgWith(3, null, {email: 'a@a'});
        });
        after(function () {
            User.register.restore();
        });

        it('should succeed on POST /api/auth/signup and return success json', function (done) {
            request(app)
                .post('/api/auth/signup')
                .send({email: 'a@a', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({ result: true }, done);
        });

        it('should fail if duplicate email on POST /api/auth/signup', function (done) {
            User.register.restore();
            userRegisterStub = sinon.stub(User, 'register')
                .withArgs('a@a', '123123')
                .callsArgWith(3, null, null, errors.AUTH_DUPLICATE);

            request(app)
                .post('/api/auth/signup')
                .send({email: 'a@a', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({ error: 'duplicate' }, done);
        });

        it('should fail on unknown error form User model on POST /api/auth/signup', function (done) {
            User.register.restore();
            userRegisterStub = sinon.stub(User, 'register')
                .withArgs('a@a', '123123')
                .callsArgWith(3, null, null, 1234);

            request(app)
                .post('/api/auth/signup')
                .send({email: 'a@a', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({ error: 'unexpected', code: 1234 }, done);
        });

        it('should fail with unverified email on POST /api/auth/signup (although it is success for user)', function (done) {
            User.register.restore();
            userRegisterStub = sinon.stub(User, 'register')
                .withArgs('a@a', '123123')
                .callsArgWith(3, null, {email: 'a@a', needVerify: true});

            request(app)
                .post('/api/auth/signup')
                .send({email: 'a@a', password: '123123'})
                .set(typeAcceptHeaders)
                .expect(200)
                .expect({ error: 'verify-email' }, done);
        });
    });

    describe('Password Restore', function () {
        var mailerStub, utilStub, userFindOneStub;

        before(function () {
            mailerStub = sinon.stub(mailer, 'send');
            utilStub = sinon.stub(util, 'genRestorePwdKey').returns('123');
            userFindOneStub = sinon.stub(User, 'findOne')
                .withArgs({email: 'a@a'})
                .callsArgWith(2, null, {email: 'a@a'});
        });
        after(function () {
            mailer.send.restore();
            util.genRestorePwdKey.restore();
            User.findOne.restore();
        });

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
                .withArgs('restore-pwd', {from: companyEmail, to: 'a@a', code: '123'})
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
                .expect({result: {email: 'a@a'}}, done);
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
