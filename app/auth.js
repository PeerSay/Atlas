var _ = require('lodash');
//var jsonParser = require('body-parser').json();
var urlencodedParser = require('body-parser').urlencoded({extended: false});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;
var errors = require('../app/errors');

function Auth(app, models, mailer, config) {
    var U = {};
    var User = models.User;

    function setupRoutes() {
        // statics
        app.get('/auth/login', sendAppEntry);
        app.get('/auth/signup', sendAppEntry);
        app.get('/auth/signup/success', sendAppEntry);  // show activation required page
        app.get('/auth/signup/verified', sendAppEntry);  // redirect after verify link click
        app.get('/projects', ensureAuthenticated, sendAppEntry); // send on F5
        app.get('/projects/*', ensureAuthenticated, sendAppEntry); // send on F5

        // local
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
        var data = req.body;
        var email = data.email;
        var password = data.password;

        console.log('[AUTH] Register-local attempt by [%s]', email);

        data.needVerify = true;
        User.register(email, password, data, function (err, user, code) {
            if (err) return next(err); //TODO

            if (code === errors.AUTH_DUPLICATE) {
                var msg = 'duplicate ' + email;
                console.log('AUTH] Failed local: info=%s', msg);
                return redirectErrorQs(req, res, msg);
            }

            if (!user) {
                console.log('AUTH] Failed local for [%s], error=%s', email, code);
                return redirectErrorQs(req, res, 'code:' + code);
            }

            if (user.needVerify) {
                mailVerifyAsync(user);
                return res.redirect('/auth/signup/success?email=' + user.email); // show verify page
            }

            loginUser(req, res, {
                user: user,
                isNew: (code === errors.AUTH_NEW_OK),
                longSession: true // don't ask on signup, long by default
            });
        });
    }

    function verifyAccount(req, res, next) {
        var uid = req.query.id;
        var email = req.query.email;

        console.log('[AUTH] Acc verify attempt from [%s]', email);

        User.verifyAccount(email, uid, function (err, user, code) {
            if (err) { return next(err); }

            if (code) {
                console.log('[AUTH] Acc verify failed for [%s], code=%s', email, code);
                return res.redirect('/auth/signup/verified?err=' + code);
            }

            return res.redirect('/auth/signup/verified');
        });
    }

    // Authenticate - local
    //
    function authenticate(req, res, next) {
        var data = req.body;
        // delegates to passportVerifyLocal, knows email/password from setup options
        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }

            if (!user) {
                if (info.code === errors.AUTH_NOT_VERIFIED) {
                    console.log('[AUTH] Failed: acc not verified for [%s]', data.email);
                    mailVerifyAsync(user);
                    return res.redirect('/auth/signup/success?email=' + user.email); // show verify page
                }

                console.log('[AUTH] Failed: err=%s, code=%s', info.error, info.code);
                return redirectErrorQs(req, res, info.error);
            }

            console.log('[AUTH] Verified-local of: user=%s, info=%s', user, info);

            loginUser(req, res, {
                user: user,
                isNew: false,
                longSession: data.longSession // TODO: form control
            });
        })(req, res, next);
    }

    function passportVerifyLocal(username, password, done) {
        console.log('[AUTH] Verify-local attempt by [%s]', username);

        User.authenticate(username, password, function (err, user, code) {
            if (err) { return done(err); }

            if (code === errors.AUTH_NOT_FOUND) {
                return done(null, false, { code: code, error: 'Wrong email or password' });
            }
            if (code === errors.AUTH_PWD_MISMATCH) {
                return done(null, false, { code: code, error: 'Wrong email or password' });
            }
            if (code === errors.AUTH_NOT_VERIFIED) {
                return done(null, false, { code: code, error: 'Account is not verified' });
            }
            if (!user) {
                return done(null, false, { code: -1, error: 'Unexpected' });
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
                var error = (info || {}).error || 'canceled';
                console.log('[AUTH] Failed linkedin: err=%s', error);
                return redirectErrorQs(req, res, error, '/auth/signup');
            }

            console.log('[AUTH] Success-linkedin for [%s], info=%s', user.email, info);

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

        User.register(data.email, data.password, data, function (err, user, code) {
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

        console.log('[AUTH] Success - logging in [%s]', user.email);

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
    function redirectErrorQs(req, res, error, path) {
        path = path || req.path;
        var qs = '?err=' + error;
        return res.redirect(path + qs);
    }

    // Mail
    //
    function mailVerifyAsync(user) {
        var verify_url = config.web.base_url +
            "/auth/signup/verify" +
            '?email=' + encodeURIComponent(user.email) +
            "&id=" + encodeURIComponent(user.needVerify);
        var locals = {
            name: user.name.full,
            url: verify_url
        };
        console.log('[AUTH] Sending verify email to [%s], url=[%s]', user.email, verify_url);
        mailer.send(user.email, 'account-activation', locals); // async!

        // TODO: err handling
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = Auth;
