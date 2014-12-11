// External dependencies
var express = require("express");
var compression = require('compression');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var passport = require('passport');

// Setup config
process.deploy = process.argv[2];
var config = require('./app/config');

// App dependencies
var Auth = require('./app/auth');
var RestApi = require('./app/rest-api');


// Connect to DB
console.log(' [DB] url: %s, security: %d', config.db.url, config.db.hash_iters);
mongoose.connect(config.db.url, {server: {socketOptions: {keepAlive: 1}}});
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

// App config
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);

// Set web options & middleware
app.disable('x-powered-by');
app.use(compression());
app.use(express.static(config.web.static_dir));
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

function log(req, res, next) {
    console.log('[%s]: %s - %s', req.method, req.url, res.statusCode);
    next();
}

// Setup routes
Auth(app).setupRoutes();
RestApi(app).setupRoutes();

// Logger (comes last)
app.all('*', log);


// Run
//
http.listen(config.web.port, function () {
    console.log(" [Web] Listening on %s...", config.web.port);
});


// Socket
//
/*
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
*/
