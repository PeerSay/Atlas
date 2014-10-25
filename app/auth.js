var _ = require('lodash');
//var jsonParser = require('body-parser').json();
var urlencodedParser = require('body-parser').urlencoded({extended: false});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;

var config = require('../app/config');
var mailer = require('../app/email/mailer');


function Auth(app, models) {
    var U = {};
    var User = models.User;
    var errors = models.errors;

    function setupRoutes() {
        // statics
        app.get('/login', sendAppEntry);
        app.get('/signup', sendAppEntry);
        app.get('/signup/success', sendAppEntry);  // show activation required page
        app.get('/signup/error', sendAppEntry);  // show activation required page
        app.get('/projects', ensureAuthenticated, sendAppEntry); // send on F5
        app.get('/projects/*', ensureAuthenticated, sendAppEntry); // send on F5

        // api auth
        app.post('/auth/signup', urlencodedParser, register); // form submit
        app.get('/auth/signup/verify', verifyAccount); // link from email
        app.post('/auth/login', urlencodedParser, authenticate);
        app.post('/api/auth/logout', logout); // api call!

        // linkedin
        app.get('/auth/linkedin', logAuthAttempt, passport.authenticate('linkedin')); // redirect to linkedin.com
        app.get('/auth/linkedin/callback', authenticateByLinkedIn); // redirect back from linkedin.com

        return U;
    }

    // Setup passport
    //
    passport.serializeUser(function (user, done) {
        console.log('[AUTH]: Passport: serialize for [%s]', user.email);

        done(null, user.email);
    });

    passport.deserializeUser(function (email, done) {
        console.log('[AUTH]: Passport: deserialize for [%s]', email);

        User.findByEmail(email, function (err, user) {
            console.log('[AUTH] Passport: deserialized: ', user);

            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        passportVerifyLocal
    ));

    passport.use(new LinkedInStrategy({
            consumerKey: config.auth.linkedin.api_key,
            consumerSecret: config.auth.linkedin.secret_key,
            callbackURL: config.web.base_url + "/auth/linkedin/callback",
            profileFields: ['id', 'first-name', 'last-name', 'email-address']
        },
        passportVerifyLinkedIn
    ));


    // Register
    //
    function register(req, res, next) {
        var params = req.body;
        var email = params.email;
        var password = params.password;

        console.log('[AUTH] Register-local attempt by [%s]', email);

        User.register(email, password, params, function (err, user, code) {
            if (err) return next(err); //TODO

            if (code === errors.AUTH_DUPLICATE) {
                var msg = 'duplicate ' + email;
                console.log('AUTH] Failed: info=%s', msg);
                return redirectErrorQs(req, res, msg);
            }

            if (!user) {
                console.log('AUTH] Failed: error=%s', code);
                return redirectErrorQs(req, res, 'code ' + code);
            }

            if (user.needVerify) {
                var locals = {
                    name: user.name.full,
                    url: config.web.base_url + "/auth/signup/verify?id=" + user.needVerify
                };
                mailer.send(user.email, 'account-activation', locals); // async! TODO: err handling

                return res.redirect('/signup/success'); // show verify page
            }

            loginUser(req, res, {
                user: user,
                isNew: (code === errors.AUTH_NEW_OK),
                longSession: true // don't ask on signup, long by default
            });
        });
    }

    function verifyAccount (req, res, next) {
        var uid = req.params.id;
        var email = req.params.email;

        console.log('[AUTH] Acc verify attempt from [%s]', email);

        User.verifyAccount(email, uid, function (err, user, code) {
            if (err) { return next(err); }

            if (code) {
                console.log('[AUTH] Acc verify failed for [%s], code=%s', user.email, code);
                return res.redirect('/signup/error?err' + code);
            }

            if (user) {
                loginUser(req, res, {
                    user: user,
                    isNew: true,
                    longSession: true // don't ask on signup, long by default
                });
            }
        });
    }

    // Authenticate - local
    //
    function authenticate(req, res, next) {
        var params = req.body;
        // delegates to passportVerifyLocal, knows email/password from setup options
        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }

            if (!user) {
                console.log('AUTH] Failed: info=%s', info.error);
                return redirectErrorQs(req, res, 'Wrong email or password');
            }

            console.log('[AUTH] Verified-local of: user=%s, info=%s', user, info);

            loginUser(req, res, {
                user: user,
                isNew: false,
                longSession: params.longSession // TODO: form control
            });
        })(req, res, next);
    }

    function passportVerifyLocal(username, password, done) {
        console.log('[AUTH] Verify-local attempt by [%s]', username);

        User.authenticate(username, password, function (err, user, code) {
            if (err) { return done(err); }

            if (!user && code === 1) {
                return done(null, false, { error: 'Incorrect username.' });
            }
            if (!user && code === 2) {
                return done(null, false, { error: 'Incorrect password.' });
            }

            return done(null, user);
        });
    }

    // Auth/register - LinkedIn
    //

    function logAuthAttempt(req, res, next) {
        console.log('[AUTH] Auth-linkedin attempt by unknown');
        next()
    }

    function authenticateByLinkedIn(req, res, next) {
        // delegates to passportVerifyLinkedIn, profile is passed by linkedin.com
        passport.authenticate('linkedin', function (err, user, info) {
            if (err) { return next(err); }

            if (!user) {
                var error = (info || {}).error || 'cancel';
                console.log('[AUTH] Failed: err=%s', error);
                return redirectErrorQs(req, res, error);
            }

            console.log('[AUTH] Success-linkedin: user=%s, info=%s', user, info);

            loginUser(req, res, {
                user: user,
                isNew: false, // TODO
                longSession: true
            });

        })(req, res, next);
    }

    function passportVerifyLinkedIn(token, tokenSecret, profile, done) {
        // Both signup/login lead here & have the same flow

        // Profile format:
        //  id: 'string'
        //  emails: [ { value: 'a@a.com' } ],
        //  name: { familyName: 'Zhytko', givenName: 'Pavel' },
        var email = (profile.emails || {}).length ? profile.emails[0] : {};
        var data = {
            email: email.value,
            password: profile.id, // use as password!
            name: profile.name, // nice to get for free TODO: add to scheme
            linkedIn: true
        };

        console.log('[AUTH] Verify-linkedin attempt by [%s]', data.email);

        return User.register(data.email, data.password, data, function (err, user, code) {
            if (err) return done(err); //TODO

            if (code === errors.AUTH_DUPLICATE) {
                return done(null, false, {error: 'duplicate ' + email});
            }

            done(null, user);
        });
    }

    function loginUser(req, res, options) {
        var user = _.pick(options.user, ['id', 'email', 'projects']); // TODO: pick projects - move to model?
        user.isNew = options.isNew; // TODO: handle on client

        // TODO: handle longSession

        console.log('[AUTH] Success-local [%s]', user.email);

        req.login(user, function (err) { // establish session...
            if (err) { return next(err); }

            res.redirect('/projects');
        });
    }

    // Statics
    //
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

    // Logout / expire
    //
    function logout(req, res) {
        req.logout();
        res.json({ result: true });
    }

    // Errors
    //

    function redirectErrorQs(req, res, error) {
        var qs = '?err=' + error;
        return res.redirect(req.path + qs);
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = Auth;
