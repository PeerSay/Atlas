//var should = require('chai').should();
var _ = require('lodash');
var express = require('express');
var request = require('supertest');

var app = express();
var RestApi = require('../app/rest-api');
var modelsMock = {
    users: MongooseModelMock()

};
RestApi(app, modelsMock).setupRoutes();


describe('REST API - Users', function () {

    describe('CRUD operations', function () {
        it('should (r)ead collection', function (done) {
            request(app)
                .get('/api/users')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done)
                .expect(function (res) {
                    if (res.body.result == null) return 'Wrong result: ' + res.body.result;
                });
        });

        it('should (r)ead item', function (done) {
            request(app)
                .get('/api/users/2')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done)
                .expect(function (res) {
                    var result = res.body.result;
                    if (result == null) return 'Wrong result: ' + res.body.result;
                    if (result.id !== 2) return 'Wrong id: ' + result.id;
                });
        });

        it('should (u)pdate item', function (done) {
            request(app)
                .put('/api/users/2')
                .send({ name: 'test' })
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done)
                .expect(function (res) {
                    var result = res.body.result;
                    if (result.id !== 2) return 'Wrong id: ' + result.id;
                    if (result.name !== 'test') return 'Wrong name: ' + result.name;
                });
        });

        it('should (d)elete item', function (done) {
            request(app)
                .delete('/api/users/1')
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done)
                .expect(function (res) {
                    var result = res.body.result;
                    if (result.id !== 1) return 'Wrong id: ' + result.id;
                    if (result.removed !== true) return 'Wrong removed: ' + result.removed;
                });
        });

        it('should (c)reate item', function (done) {
            request(app)
                .post('/api/users')
                .send({ name: 'test' })
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200, done)
                .expect(function (res) {
                    var result = res.body.result;
                    if (result.id !== 3) return 'Wrong id: ' + result.id;
                    if (result.name !== 'test') return 'Wrong name: ' + result.name;
                });
        });

    });


    describe('Error handling', function () {
        it('should return 400 on POST without body', function (done) {
            request(app)
                .post('/api/users')
                .set('Accept', 'application/json')
                .expect(400, done)
                .expect(function (res) {
                    if (/No JSON/.test(res.body.error) !== true) return 'Wrong error obj: ' + res.body.error;
                });
        });

        it('should return 400 on PUT without body', function (done) {
            request(app)
                .put('/api/users/1')
                .set('Accept', 'application/json')
                .expect(400, done)
                .expect(function (res) {
                    if (/No JSON/.test(res.body.error) !== true) return 'Wrong error obj: ' + res.body.error;
                });
        });

        it('should return 400 on POST with non-json body', function (done) {
            request(app)
                .post('/api/users')
                .send('test-str')
                .set('Accept', 'application/json')
                .expect(400, done)
                .expect(function (res) {
                    if (/No JSON/.test(res.body.error) !== true) return 'Wrong error obj: ' + res.body.error;
                });
        });

        it('should return 400 on PUT with non-json body', function (done) {
            request(app)
                .put('/api/users/1')
                .send('test-str')
                .set('Accept', 'application/json')
                .expect(400, done)
                .expect(function (res) {
                    if (/No JSON/.test(res.body.error) !== true) return 'Wrong error obj: ' + res.body.error;
                });
        });

        it('should return 404 on wrong api path', function (done) {
            request(app)
                .get('/not-api')
                .set('Accept', 'application/json')
                .expect(404, done);
        });

        it('should return 404 on wrong collection name', function (done) {
            request(app)
                .get('/api/undefined')
                .set('Accept', 'application/json')
                .expect(404, done);
        });

        it('should return 404 on GET with wrong id', function (done) {
            request(app)
                .get('/api/users/100')
                .set('Accept', 'application/json')
                .expect(404, done);
        });

        it('should return 404 on PUT with wrong id', function (done) {
            request(app)
                .put('/api/users/100')
                .send({name: 'a'})
                .set('Accept', 'application/json')
                .expect(404, done);
        });

        it('should return 404 on DELETE with wrong id', function (done) {
            request(app)
                .delete('/api/users/100')
                .set('Accept', 'application/json')
                .expect(404, done);
        });

        it('should return 406 on non-json Accept header', function (done) {
            request(app)
                .get('/api/users')
                .set('Accept', 'text/xml')
                .expect('Content-Type', /json/)
                .expect(406, done)
                .expect(function (res) {
                    if (res.body.error !== 'Not Acceptable') return 'Wrong error obj: ' + res.body.error;
                });
        });
    });
});


function MongooseModelMock() {
    var collection = [
        {id: 1},
        {id: 2}
    ];
    var M = function (body) {
        this.save = function (cb) {
            cb(null, _.extend(body, {id: 3}));
        }
    };


    M.find = function (query, sel, cb) {
        cb(null, collection);
    };
    M.findOne = function (query, sel, cb) {
        cb(null, _.find(collection, query));
    };
    M.findOneAndUpdate = function (query, body, cb) {
        cb(null, _.extend(_.find(collection, query), body));
    };
    M.findOneAndRemove = function (query, cb) {
        cb(null, _.find(collection, query));
    };
    return M;
}
