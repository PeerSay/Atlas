var jsonParser = require('body-parser').json();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


function Auth(app, UserModel) {
    var U = {};

    function setupRoutes() {
        // statics
        app.get('/login', sendAppEntry);
        app.get('/signup', sendAppEntry);
        app.get('/projects', ensureAuthenticated, sendAppEntry); // send on F5
        app.get('/projects/:id', ensureAuthenticated, sendAppEntry); // send on F5

        //auth
        app.post('/signup', jsonParser, signup);
        app.post('/login', jsonParser, login);
        app.get('/logout', logout);

        return U;
    }

    //Setup passport
    passport.serializeUser(function (user, done) {
        //console.log('Passport: serialize: %s', user.email);
        done(null, user.email);
    });

    passport.deserializeUser(function (email, done) {
        //console.log('Passport: deserialize: %s', email);

        UserModel.findByEmail(email, function (err, user) {
            //console.log('Passport: deserialized: %s', user.email);

            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function (username, password, done) {
            console.log('Passport: use - username=%s, pwd=%s', username, password);

            UserModel.authenticate(username, password, function (err, user, code) {
                console.log('Passport: used - authenticated? user=%s, code=%s', (user ? user.email : null), code);

                if (err) { return done(err); }

                if (!user && code === 1) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (!user && code === 2) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
        }
    ));


    function sendAppEntry(req, res) {
        var AUTH_RE = /(\/login|\/signup)/;
        if (req.isAuthenticated() && AUTH_RE.test(req.path)) {
            return res.redirect('/projects');
        }

        res.sendFile('app.html', {
            root: app.config.web.static_dir
        });
    }


    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    }


    function signup(req, res, next) {
        var params = req.body;
        console.log('Registering email', params.email);

        UserModel.findByEmail(params.email, function (err, user) {
            if (user) {
                return notValid(res, 'duplicate ' + user.email);
            }
            else {
                console.log('New user', params);

                (new UserModel(params))
                    .save(function (err, doc) {
                        if (err) return console.error(err);

                        if (!doc) {
                            return notValid(res, 'it'); // TODO
                        }

                        req.login(doc, function (err) {
                            if (err) { return next(err); }
                            res.json({ result: doc});
                        });
                    })
            }
        });
    }


    function login(req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }

            if (!user) {
                console.log('Auth fail: info=%s', info.message);
                return notFound(res, info);
            }

            req.login(user, function (err) {
                if (err) { return next(err); }
                res.json({ result: user});
            });
        })(req, res, next);
    }


    function logout(req, res, next) {
        req.logout();
        res.json({ result: true });
    }


    function notValid(res, msg) {
        return res
            .status(409)
            .send({error: 'Not valid: ' + msg});
    }

    function notFound(res, code) {
        //TODO: log code
        return res
            .status(404)
            .send({error: 'Wrong email or password'}); // Do not expose code/reason to user!
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = Auth;
