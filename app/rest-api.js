var _ = require('lodash');
var jsonParser = require('body-parser').json();

// util
function isEmpty(obj) {
    return !Object.keys(obj).length;
}


function RestApi(app, models) {
    var U = {};

    function setupRoutes() {
        app.get('/api/users', _.curry(validateAccept)(readAll, 'users'));
        app.get('/api/users/:id', _.curry(validateAccept)(read, 'users'));
        app.put('/api/users/:id', jsonParser, _.curry(validateAccept)(update, 'users'));
        app.post('/api/users', jsonParser, _.curry(validateAccept)(create, 'users'));
        app.delete('/api/users/:id', _.curry(validateAccept)(remove, 'users'));
        return U;
    }


    function readAll(model, req, res, next) {
        model.find({}, 'id name email', function (err, arr) {
            //if (err) return console.error(err);

            res.json({ result: arr });
            next();
        });
    }

    function read(model, req, res, next) {
        var id = Number(req.params.id);

        model.findOne({id: id}, 'id name email', function (err, doc) {
            //if (err) return console.error(err);

            if (doc) {
                res.json({ result: doc });
                next();
            }
            else {
                notFound(res, id);
            }
        });
    }

    function update(model, req, res, next) {
        var id = Number(req.params.id);

        delete req.body._id; // XXX

        if (!validateBody(req.body, res)) {
            return;
        }

        model.findOneAndUpdate({id: id}, req.body, function (err, doc) {
            //if (err) return console.error(err);

            if (doc) {
                res.json({ result: doc });
                next();
            }
            else {
                notFound(res, id);
            }
        });
    }

    function create(model, req, res, next) {
        delete req.body._id; // XXX

        if (!validateBody(req.body, res)) {
            return;
        }

        (new model(req.body))
            .save(function (err, doc) {
                //if (err) return console.error(err);

                if (doc) {
                    res.json({ result: doc});
                    next();
                } else {
                    modelError(res, err);
                }
            });
    }

    function remove(model, req, res, next) {
        var id = Number(req.params.id);

        model.findOneAndRemove({id: id}, function (err, doc) {
            //if (err) return console.error(err);

            if (doc) {
                res.json({
                    result: {
                        id: doc.id,
                        removed: true
                    }
                });
                next();
            }
            else {
                notFound(res, id);
            }
        })
    }

    function validateAccept(method, model_name, req, res, next) {
        res.format({
            json: function () {
                method.call(U, models[model_name], req, res, next);
            },
            'default': function () {
                notAcceptable(res);
            }
        });
    }

    function validateBody(body, res) {
        var ret = true;
        if (isEmpty(body)) {
            badRequest(res, 'No JSON');
            ret = false;
        }

        return ret;
    }

    function modelError(res, err) {
        var errors = {
            ValidationError: function () {
                var key = Object.keys(err.errors)[0];
                var msg = [key, err.errors[key].type].join(' ');
                return msg;
            },
            MongoError: function () {
                if (err.code === 11000) { // non unique
                    var error_msg = /dup key:.*"(.*?)"/.exec(err.err);
                    var msg = [error_msg[1], 'exists'].join(' ');
                    return msg;
                }
                else {
                    return 'db validation';
                }
            }
        };

        return notValid(res, errors[err.name]());
    }

    function notAcceptable(res) {
        return res
            .status(406)
            .send({error: 'Not Acceptable'});
    }

    function badRequest(res, msg) {
        return res
            .status(400)
            .send({error: 'Bad request: ' + msg});
    }

    function notFound(res, msg) {
        return res
            .status(404)
            .send({error: 'Not found: ' + msg});
    }

    function notValid(res, msg) {
        return res
            .status(409)
            .send({error: 'Not valid: ' + msg});
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = RestApi;
