// requre
var _ = require('lodash');
var jsonParser = require('body-parser').json();

var models = {
    users: require('./users').UserModel
};

//console.log('>>> users.find=%O', users);


function Users(app) {
    var U = {};

    function setupRoutes() {
        app.get('/api/users', _.curry(readAll)('users'));
        app.get('/api/user/:id', _.curry(read)('users'));
        app.put('/api/user/:id', jsonParser, _.curry(update)('users'));
        app.post('/api/user', jsonParser, _.curry(create)('users'));
        app.delete('/api/user/:id', _.curry(remove)('users'));
    }


    function readAll(model, req, res, next) {
        models[model].find({}, 'id name email', function (err, arr) {
            if (err) return console.error(err);
            res.json({ result:  arr});
            next();
        });
    }

    function read(model, req, res, next) {
        models[model].findOne({id: Number(req.params.id)}, 'id name email', function (err, usr) {
            if (err) return console.error(err);
            res.json(usr);
            next();
        });
    }

    function update (model, req, res, next) {
        //console.log('>>>Updating: id=%s, params=%O', req.params.id, req.body);
        delete req.body._id; // XXX

        models[model].findOneAndUpdate({id: Number(req.params.id)}, req.body, function (err, usr) {
            if (err) return console.error(err);
            //console.log('>>>Updated: %O', usr);

            res.json(usr);
            next();
        });
    }

    function create(model, req, res, next) {
        delete req.body._id; // XXX

        (new models[model](req.body))
            .save(function (err, usr) {
                if (err) return console.error(err);
                //console.log('>>>Created: %O', usr);

                res.json(usr);
                next();
            })
    }

    function remove (model, req, res, next) {
        var id = Number(req.params.id);

        models[model].remove({id: id}, function (err) {
            if (err) return console.error(err);

            res.json({id: id, removed: 'ok'});
            next();
        })
    }


    U.setupRoutes = setupRoutes;
    return U;
}

module.exports = {
    Users: Users
};
