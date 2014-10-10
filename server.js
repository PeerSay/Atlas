// External dependencies
var express = require("express");
var compression = require('compression');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var passport = require('passport');

// App dependencies
var config = require('./app/config');
var Auth = require('./app/auth');
var RestApi = require('./app/rest-api');
var models = {
    users: require('./app/users').UserModel
};


// Connect to DB
console.log('[DB] url: %s, security: %d', config.db.url, config.db.hash_iters);
mongoose.connect(config.db.url, {server: {socketOptions: {keepAlive: 1}}});
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

// App config
var app = express();
app.config = config;
var http = require('http').Server(app);
var sio = require('socket.io')(http);

// Set options & middleware
app.disable('x-powered-by');
app.use(compression());
app.use(express.static(config.web.static_dir));
app.use(cookieParser());
app.use(session({
    secret: 'some secret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

function log (req, res, next) {
    console.log('[%s]: %s - %s', req.method, req.url, res.statusCode);
    next();
}

// Setup routes
Auth(app, models.users).setupRoutes();
RestApi(app, models).setupRoutes();

// Logger (comes last)
app.all('*', log);


// Run
//
http.listen(config.web.port, function () {
    console.log("[Web] Listening on %s...", config.web.port);
});


// Socket
//
sio.on('connection', function (socket) {
    console.log('[Sock] New socket: client.id=[%s]', socket.client.id);

    socket.emit('msg', 'hello');
    socket.join('room');

    socket.on('disconnect', function () {
        console.log('[Sock] disconnect');
    });
});

var counter = 0;
setInterval(function () {
    sio.to('room').emit('msg', {cnt: counter++});
}, 2000);
