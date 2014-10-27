var _ = require('lodash');
var jsonParser = require('body-parser').json();

// util
function isEmpty(obj) {
    return !Object.keys(obj).length;
}


function RestApi(app, models) {
    var U = {};

    function setupRoutes() {
        app.get('/api/users', _.curry(validateAccept)(readAll, 'User'));
        app.get('/api/users/:id', _.curry(validateAccept)(read, 'User'));
        app.put('/api/users/:id', jsonParser, _.curry(validateAcceptAndBody)(update, 'User'));
        app.post('/api/users', jsonParser, _.curry(validateAcceptAndBody)(create, 'User'));
        app.delete('/api/users/:id', _.curry(validateAccept)(remove, 'User'));

        app.post('/api/projects', jsonParser, _.curry(validateAcceptAndBody)(createProject, 'User'));
        app.delete('/api/projects/:id', _.curry(validateAccept)(removeProject, 'User'));
        return U;
    }

    function createProject(model, req, res) {
        var project = req.body;

        if (!req.user) {
            // TODO: real auth
            return notFound(res, 1);
        }

        console.log('[API] Creating project for user id=[%s]', req.user.id);

        model.findOne({id: req.user.id}, function (err, user) {
            //if (err) return console.error(err);

            user.createProject(project, function (err, prj) {
                //if (err) return console.error(err);

                res.json({ result: prj });
            });
        });
    }

    function removeProject(model, req, res) {
        var project_id = Number(req.params.id);

        console.log('[API] Removing project for user id=[%s]', req.user.id);

        if (!req.user) {
            // TODO: real auth
            return notFound(res, 1);
        }

        model.findOne({id: req.user.id}, function (err, user) {
            //if (err) return console.error(err);

            user.removeProject(project_id, function (err, result) {
                //if (err) return console.error(err);

                res.json({ result: result });
            });
        });
    }

    // Generic CRUD API (TODO: see if all can be expressed with it)

    function readAll(model, req, res, next) {
        model.find({}, '', function (err, arr) {
            //if (err) return console.error(err);

            res.json({ result: arr });
            next();
        });
    }

    function read(model, req, res, next) {
        var id = Number(req.params.id);

        model.findOne({id: id}, 'id email projects -_id', function (err, doc) { // XXX: not generic!
            //if (err) return console.error(err); // XXX: 500 err

            if (doc) {
                res.json({ result: doc });
            }
            else {
                notFound(res, id);
            }
        });
    }

    function update(model, req, res, next) {
        var id = Number(req.params.id);

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

        model.create(req.body, function (err, doc) {
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
        console.log('[API] %s %s', req.method, req.url);
        res.format({
            json: function () {
                method.call(U, models[model_name], req, res, next);
            },
            'default': function () {
                notAcceptable(res);
            }
        });
    }

    function validateAcceptAndBody(method, model_name, req, res, next) {
        if (!validateBody(req.body, res)) {
            return;
        }

        validateAccept(method, model_name, req, res, next);
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
