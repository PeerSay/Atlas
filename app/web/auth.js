var _ = require('lodash');
var jsonParser = require('body-parser').json();
var urlencodedParser = require('body-parser').urlencoded({extended: false});
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;

// App dependencies
var config = require(appRoot + '/app/config');
var util = require(appRoot + '/app/lib/util');
var codes = require(appRoot + '/app/web/codes');
var mailer = require(appRoot + '/app/lib/email/mailer');
var User = require(appRoot + '/app/models/users').UserModel;

var constant = {
    SESS_NORMAL: 1000 * 60 * 60 * 12, // 12h
    SESS_LONG: 1000 * 60 * 60 * 24 * 14, // 14d
    SESS_RESTORE: 1000 * 60 * 20 // 20min
};
var defAppEntryUrl = '/projects';
var companyEmail = 'PeerSay <team@peer-say.com>';


function Auth(app) {
    var U = {};

    function setupRoutes() {
        // Status
        app.get('/api/auth/status', authStatus);

        // login
        app.get('/auth/login', sendAppEntry);
        app.post('/api/auth/login', jsonParser, authenticate); // api call that authenticates and establishes session
        app.post('/auth/login', proceedLoggedIn); // form submit to trigger browser password dialog

        // signup
        app.get('/auth/signup', sendAppEntry);
        app.post('/api/auth/signup', jsonParser, register); // api call that registers user
        app.post('/auth/signup', proceedLoggedIn); // form submit to trigger browser password dialog
        app.get('/auth/signup/success', sendAppEntry);  // show activation required page
        app.get('/auth/signup/verify', verifyAccount); // link from email
        app.get('/auth/signup/verified', sendAppEntry);  // redirect after verify link click

        // restore
        app.get('/auth/restore', sendAppEntry);
        app.post('/api/auth/restore', jsonParser, restorePassword);
        app.get('/auth/restore/complete', sendAppEntry); // ask for code and new password
        app.post('/api/auth/restore/complete', jsonParser, restorePasswordComplete);

        // logout
        app.post('/api/auth/logout', logout);

        // linkedin
        app.get('/auth/linkedin', authenticateByLinkedIn); // redirect to linkedin.com
        app.get('/auth/linkedin/callback', authenticateByLinkedInCallback); // redirect back from linkedin.com

        // Private pages
        app.get('/projects', ensureAuthenticated, sendAppEntry); // send on F5
        app.get('/projects/*', ensureAuthenticated, sendAppEntry); // send on F5

        return U;
    }

    // Setup passport
    //
    passport.serializeUser(function (user, done) {
        done(null, user.email);
    });

    passport.deserializeUser(function (email, done) {
        // Get minimal fields only; additional requests are required to perform API operations
        User.findOne({email: email}, 'id -_id email', function (err, user) {
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
            profileFields: ['id', 'first-name', 'last-name', 'email-address']
            /*callbackURL is not needed as it's passed per request*/
        },
        passportVerifyLinkedIn
    ));

    //Status
    //
    function authStatus(req, res) {
        var authenticated = req.isAuthenticated();
        var email = (req.user || {}).email;
        console.log('[AUTH] Status for [%s] result=[%s]', email, authenticated);

        return res.json({result: authenticated});
    }

    // Register
    //
    function register(req, res, next) {
        var data = req.body;
        var email = data.email;
        var password = data.password;
        data.needVerify = true;

        console.log('[AUTH] Register-local attempt by [%s]', email);

        User.register(email, password, data, function (err, user, code) {
            if (err) return next(err); //TODO

            if (code === codes.AUTH_DUPLICATE) {
                var msg = 'duplicate ' + email;
                console.log('AUTH] Failed local: msg=%s', msg);

                return res.json({error: 'duplicate'});
            }

            if (!user) {
                // Should not happen!
                console.log('AUTH] Failed local for [%s], error=%s', email, code);
                return res.json({error: 'unexpected', code: code});
            }

            if (user.needVerify) {
                mailVerifyAsync(user, util.baseURL(req));
                return res.json({error: 'verify-email'});
            }

            var login = {
                user: user,
                isNew: (code === codes.AUTH_NEW_OK),
                longSession: true // don't ask on signup, long by default
            };
            loginUser(req, login, function (err) {
                if (err) { return next(err); }

                // Client will re-submit form to trigger password save form
                return res.json({result: true});
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

            console.log('[AUTH] Acc verify success for [%s]', email);

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

            if (info) {
                if (info.code === codes.AUTH_NOT_VERIFIED) {
                    console.log('[AUTH] Failed local: acc not verified for [%s]', data.email);
                    // Send verify email again!
                    mailVerifyAsync(user, util.baseURL(req));

                    // Client will redirect to (/auth/signup/success?email=' + email) => show verify page
                    return res.json({error: 'verify-email'});
                }

                console.log('[AUTH] Failed local: err=%s, code=%s', info.error, info.code);
                return res.json({error: info.error});
            }

            console.log('[AUTH] Verified-local [%s], info=%s', user.email, info);

            var login = {
                user: user,
                isNew: false,
                longSession: data.longSession
            };
            loginUser(req, login, function (err) {
                if (err) { return next(err); }

                // Client will re-submit form to trigger password save form
                return res.json({result: true});
            });
        })(req, res, next);
    }

    function passportVerifyLocal(username, password, done) {
        console.log('[AUTH] Verify-local attempt by [%s]', username);

        User.authenticate(username, password, function (err, user, code) {
            if (err) { return done(err); }

            if (code === codes.AUTH_NOT_FOUND) {
                return done(null, null, {code: code, error: 'Wrong email or password'});
            }
            if (code === codes.AUTH_PWD_MISMATCH) {
                return done(null, null, {code: code, error: 'Wrong email or password'});
            }
            if (code === codes.AUTH_NOT_VERIFIED) {
                return done(null, user, {code: code, error: 'Account is not verified'});
            }
            if (!user) {
                return done(null, null, {code: -1, error: 'Unexpected'});
            }

            return done(null, user);
        });
    }

    function loginUser(req, options, done) {
        var user = options.user;
        var maxAge = options.longSession ?
            constant.SESS_LONG : constant.SESS_NORMAL;

        console.log('[AUTH] Success - logging in [%s], for %sh', user.email, maxAge / (1000 * 60 * 60));

        // Set session age and establish session
        req.session.cookie.maxAge = maxAge;
        req.login(user, function (err) {
            if (err) { return done(err); }
            done(null, req.user);
        });
    }

    function proceedLoggedIn(req, res) {
        // Get & reset attempted URL
        var appEntryUrl = req.session.attemptedUrl || defAppEntryUrl;
        req.session.attemptedUrl = null;

        var email = req.user.email;
        console.log('[AUTH] Proceed logged-in [%s] to=[%s]', email, appEntryUrl);

        return res.redirect(appEntryUrl);
    }

    // Auth/register - LinkedIn
    //

    function authenticateByLinkedIn(req, res, next) {
        console.log('[AUTH] Auth-linkedin attempt');

        passport.authenticate(
            'linkedin',
            {
                // Note: I failed to find the list of available scope values in LinkedIn docs,
                // These are gathered from different answers on StackOverflow:
                // Note2: new LinkedIn policy disallows 'r_contactinfo', 'r_network': https://developer.linkedin.com/support/developer-program-transition
                scope: ['r_basicprofile', 'r_emailaddress'],
                callbackURL: '/auth/linkedin/callback' // relative URL is OK
            }
        )(req, res, next);
    }

    function authenticateByLinkedInCallback(req, res, next) {
        // delegates to passportVerifyLinkedIn, profile is passed by linkedin.com
        passport.authenticate('linkedin', function (err, user, info) {
            if (err) { return next(err); }

            if (!user) {
                var error = (info || {}).error || 'canceled';
                console.log('[AUTH] Failed linkedin: err=%s', error);
                return redirectErrorQs(req, res, error, '/auth/signup');
            }

            console.log('[AUTH] Success-linkedin for [%s], info=%s', user.email, info);

            var login = {
                user: user,
                isNew: false,
                longSession: true
            };
            loginUser(req, login, function (err) {
                if (err) { return next(err); }

                return proceedLoggedIn(req, res);
            });

        })(req, res, next);
    }

    function passportVerifyLinkedIn(token, tokenSecret, profile, done) {
        // Both signup/login lead here & have the same flow
        //
        // Profile format:
        //  id: 'string'
        //  emails: [ { value: 'a@a.com' } ],
        //  name: { familyName: 'Zhytko', givenName: 'Pavel' },
        var email = (profile.emails || {}).length ? profile.emails[0] : {};
        var data = {
            email: email.value,
            password: profile.id, // use id as password!
            name: profile.name, // nice to get for free
            linkedIn: true
        };

        console.log('[AUTH] Verify-linkedin attempt by [%s]', data.email);

        User.register(data.email, data.password, data, function (err, user, code) {
            if (err) return done(err); //TODO

            if (code === codes.AUTH_DUPLICATE) {
                return done(null, false, {error: 'duplicate ' + email});
            }

            done(null, user);
        });
    }

    // Restore
    //
    function restorePassword(req, res, next) {
        var data = req.body;
        console.log('[AUTH] Restore for [%s]', data.email);

        User.findOne({email: data.email}, 'email linkedIn', function (err, user) {
            if (err) { next(err); }

            if (!user) {
                console.log('[AUTH] Restore failed - not found [%s]', data.email);
                return res.json({error: 'not found: ' + data.email});
            }

            if (user.linkedIn) {
                console.log('[AUTH] Restore failed - [%s] is linkedIn', data.email);
                return res.json({error: 'linkedin'});
            }

            req.session.cookie.maxAge = constant.SESS_RESTORE;
            var restore = req.session.restore = {
                email: user.email,
                code: util.genRestorePwdKey()
            };

            mailRestoreAsync(restore);
            res.json({result: true});
        });
    }

    function restorePasswordComplete(req, res, next) {
        var data = req.body;
        var restore = req.session.restore;

        console.log('[AUTH] Restore complete attempt for [%s]', data.email);

        if (!restore) {
            console.log('[AUTH] Restore complete failed - no session');
            return res.json({error: 'no session'});
        }

        if (restore.code !== data.code) {
            console.log('[AUTH] Restore complete failed - invalid [%s] != [%s]', restore.code, data.code);
            return res.json({error: 'invalid code'});
        }

        User.updatePassword(restore.email, data.password, function (err, user, code) {
            if (err) { return next(err); }

            if (!user) {
                // this should not happen as
                // 1) user exists check is done on prev step and
                // 2) email must be stored in session
                return res.json({error: 'code:' + code});
            }

            var login = {
                user: user,
                isNew: false,
                longSession: true
            };
            loginUser(req, login, function (err, user) {
                if (err) { return next(err); }

                var result = {email: user.email};
                return res.json({result: result});
            });
        });
    }

    // Statics
    //
    function sendAppEntry(req, res) {
        var AUTH_RE = /\/auth\//; // skip auth pages if user is logged in
        if (AUTH_RE.test(req.path) && req.isAuthenticated()) {
            return res.redirect('/projects');
        }

        res.sendFile('app.html', {root: config.web.static_dir});
    }

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        // For use case: user goes to page after session is expired,
        // need redirect right to that page after login
        req.session.attemptedUrl = req.url;
        res.redirect('/auth/login');
    }

    // Logout / expire
    //
    function logout(req, res) {
        if (req.user) {
            var email = req.user.email;
            console.log('[AUTH] Logging out user [%s]', email);

            req.logout();
        } else {
            console.log('[AUTH] Logging out - skip: session expired');
        }

        res.json({result: true});
    }

    // Errors
    //
    function redirectErrorQs(req, res, error, path) {
        path = path || req.path;
        var qs = '?err=' + error;
        var url = path + qs;

        console.log('[AUTH] Redirect with err to=[%s]', url);

        return res.redirect(url);
    }

    // Mail
    //
    function mailVerifyAsync(user, base_url) {
        var verify_url = base_url +
            "/auth/signup/verify" +
            '?email=' + encodeURIComponent(user.email) +
            "&id=" + encodeURIComponent(user.needVerify);
        var fullName = (user.name || {}).full || '';
        var to = user.email;
        var locals = {
            from: companyEmail,
            to: to,
            name: fullName,
            url: verify_url
        };
        var tpl = 'account-activation';
        console.log('[AUTH] Sending [%s] email to [%s], url=[%s]', tpl, to, verify_url);

        mailer.send(tpl, locals); // async!
        // TODO: err handling
    }

    function mailWelcomeAsync() {
        //TODO
    }

    function mailRestoreAsync(data) {
        var to = data.email;
        var locals = {
            from: companyEmail,
            to: to,
            code: data.code
        };
        var tpl = 'restore-pwd';
        console.log('[AUTH] Sending [%s] email to [%s], code=[%s]', tpl, to, data.code);

        mailer.send(tpl, locals); // async!
        // TODO: err handling
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = Auth;
