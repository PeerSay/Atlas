//var should = require('chai').should();
var _ = require('lodash');
var express = require('express');
var request = require('supertest');

var app = express();

// --> Under test
require('../app/api-validate')(app).setupRoutes();


describe('REST API - Validation', function () {

    describe('General API format & headres', function () {
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
});
