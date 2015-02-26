//var should = require('chai').should();
var _ = require('lodash');
var express = require('express');
var request = require('supertest');

var app = express();

// --> Under test
require('../app/api-validate')(app).setupRoutes();


describe('REST API - Validation', function () {

    describe('General API format & headers', function () {
        it('should return 406 on non-json Accept header', function (done) {
            request(app)
                .get('/api/users')
                .set('Accept', 'text/xml') // <--
                .expect(406)
                .expect({error: 'Not acceptable: text/xml'}, done);
        });

        it('should consider json if no Accept header', function (done) {
            request(app)
                .get('/api/users')
                // <-- no .set('Accept',..
                .expect(404) // as no paths for it
                .expect({}, done);
        });

        it('should return 400 on POST without body', function (done) {
            request(app)
                .post('/api/some')
                // <-- no send
                .set('Accept', 'application/json')
                .expect(400)
                .expect({error: 'Bad request: not JSON'}, done);
        });

        it('should return 400 on PUT without body', function (done) {
            request(app)
                .put('/api/some')
                // <-- no send
                .set('Accept', 'application/json')
                .expect(400)
                .expect({error: 'Bad request: not JSON'}, done);
        });

        it('should return 400 on POST with non-json body', function (done) {
            request(app)
                .post('/api/users')
                .send('test-str') // <--
                .set('Accept', 'application/json')
                .expect(400)
                .expect({error: 'Bad request: not JSON'}, done);
        });

        it('should return 400 on PUT with non-json body', function (done) {
            request(app)
                .put('/api/users')
                .send('test-str') // <--
                .set('Accept', 'application/json')
                .expect(400)
                .expect({error: 'Bad request: not JSON'}, done);
        });

        it('should return 400 on PATCH with non-json body', function (done) {
            request(app)
                .patch('/api/users')
                .send('test-str') // <--
                .set('Accept', 'application/json')
                .expect(400)
                .expect({error: 'Bad request: not JSON'}, done);
        });

        it('should return 404 on wrong api path', function (done) {
            request(app)
                .get('/not-api') // <--
                .set('Accept', 'application/json')
                .expect(404, done);
        });

        it('should return 404 on wrong collection name', function (done) {
            request(app)
                .get('/api/undefined') // <--
                .set('Accept', 'application/json')
                .expect(404, done);
        });
    });

    describe('Auth API - Login', function () {
        it('should return 409 on no email param for /login', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({a: 1})// <-- expected: {email: '...', password: '', longSession: true|false}
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: email is required'}, done);
        });

        it('should return 409 on non-email param for /login', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({email: 'abc'})// <-- expected: {email: '...', password: '', longSession: true|false}
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: email must be a valid email'}, done);
        });

        it('should return 409 on no password param for /login', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({email: 'a@a'})// <-- expected: {email: '...', password: '', longSession: true|false}
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: password is required'}, done);
        });

        it('should return 409 on ill-formatted password for /login', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({email: 'a@a', password: '123'}) // <-- min 6 chars pwd
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: password length must be at least 6 characters long'}, done);
        });

        it('should return 409 on no longSession for /login', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({email: 'a@a', password: '123123'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: longSession is required'}, done);
        });

        it('should return 409 on non-boolean longSession for /login', function (done) {
            request(app)
                .post('/api/auth/login')
                .send({email: 'a@a', password: '123123', longSession: 'some'})
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: longSession must be a boolean'}, done);
        });
    });

    describe('Auth API - Restore', function () {
        it('should return 409 on no email param for /restore', function (done) {
            request(app)
                .post('/api/auth/restore')
                .send({a: 1}) // <-- expected: {email: '...'}
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: email is required'}, done);
        });

        it('should return 409 on non-string param for /restore', function (done) {
            request(app)
                .post('/api/auth/restore')
                .send({email: 123}) // <--
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: email must be a string'}, done);
        });

        it('should return 409 on non-email param for /restore', function (done) {
            request(app)
                .post('/api/auth/restore')
                .send({email: 'abc'})// <--
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: email must be a valid email'}, done);
        });

        it('should return 409 on bad params for /restore/complete', function (done) {
            request(app)
                .post('/api/auth/restore/complete')
                .send({code: 'aaaaaa'})// <-- expected: {code: '...', password: '...'}
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: password is required'}, done);
        });

        it('should return 409 on ill-formatted password for /restore/complete', function (done) {
            request(app)
                .post('/api/auth/restore/complete')
                .send({code: 'aaa123', password: '123'}) // <-- min 6 chars pwd
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: password length must be at least 6 characters long'}, done);
        });

        it('should return 409 on ill-formatted code for /restore/complete', function (done) {
            request(app)
                .post('/api/auth/restore/complete')
                .send({code: '-', password: '123123'}) // <-- alpha-num code
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect(409)
                .expect({error: 'Not valid: code must only contain alpha-numeric characters'}, done);
        });
    });
});
