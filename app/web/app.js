// External dependencies
var path = require('path');
var express = require("express");
var compression = require('compression');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var passport = require('passport');
var swig = require('swig');

// Setup config
process.deploy = process.argv[2];
var config = require(appRoot + '/app/config');

// Run
//

function run() {
    // Connect to DB
    console.log(' [DB] url: %s, security: %d', config.db.url, config.db.hash_iters);
    mongoose.connect(config.db.url, {server: {socketOptions: {keepAlive: 1}}}, onMongooseConnect);
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

    // Web config
    var app = express();
    var http = require('http').Server(app);

    // Set web options & middleware
    app.disable('x-powered-by');
    app.use(compression());

    app.use(express.static(config.web.static_dir));
    app.use('/bower_components', express.static(path.join(appRoot, 'static', 'bower_components')));
    app.use('/files', express.static(path.join(appRoot, 'files')));

    app.use(cookieParser());
    app.use(session({
        secret: '8a779a89-8e82-4c31-80a0-284eed6ee12f',
        resave: true,
        saveUninitialized: true,
        store: new MongoStore({
            mongoose_connection: mongoose.connections[0]
        })
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Swig templates (for 404 page)
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', config.web.static_dir + '/tpl');
    app.set('view cache', false);
    swig.setDefaults({ cache: false }); //TODO - comment one of them

    // Setup routes (order matters)
    //
    require(appRoot + '/app/web/api-validate')(app).setupRoutes();
    require(appRoot + '/app/web/auth')(app).setupRoutes();
    require(appRoot + '/app/web/api')(app).setupRoutes();
    require(appRoot + '/app/web/api-public')(app).setupRoutes();

    // Listen port
    //
    function onMongooseConnect(err) {
        if(err)  { throw err; }

        http.listen(config.web.port, function () {
            console.log(" [Web] Listening on %s...", config.web.port);
        });
    }
}

module.exports = {
    run: run
};
