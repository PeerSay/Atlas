//var _ = require('lodash');
var jsonParser = require('body-parser').json();


function Auth(app, UserModel) {
    var U = {};

    function setupRoutes() {
        // statics
        app.get('/login', sendAppEntry);
        app.get('/signup', sendAppEntry);
        app.get('/dashboard', sendAppEntry); // TODO: ensure auth

        //auth
        app.post('/api/register', jsonParser, register);
        app.post('/api/authenticate', jsonParser, authenticate);

        return U;
    }


    function register(req, res, next) {
        var user = req.body;

        UserModel.findByEmail(user.email, function (err, doc) {
            if (doc) {
                return notValid(res, 'duplicate ' + user.email);
            }
            else {
                (new UserModel(user))
                    .save(function (err, doc) {
                        //if (err) return console.error(err);

                        if (doc) {
                            res.json({ result: doc});
                            next();
                        } else {
                            notValid(res, 'it'); // TODO
                        }
                    })
            }
        });
    }

    function authenticate(req, res, next) {
        var user = req.body;

        UserModel.authenticate(user.email, user.password, function (err, user, code) {
            //if (err) return 500();

            if (user) {
                res.json({ result: user});
                next();
            }
            else {
                console.log('Auth fail: code=%d', code);
                notFound(res, code);
            }
        });
    }

    function sendAppEntry(req, res) {
        var options = {
            root: app.config.web.static_dir
        };
        res.sendFile('app.html', options);
    }


    function notValid(res, msg) {
        return res
            .status(409)
            .send({error: 'Not valid: ' + msg})
            .end();
    }

    function notFound(res, code) {
        //log code
        return res
            .status(404)
            .send({error: 'Not found'}) // Do not expose code/reason to user!
            .end();
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = Auth;
