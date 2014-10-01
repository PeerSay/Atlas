// External dependencies
var path = require('path');
var express = require("express");
var compression = require('compression');
var mongoose = require('mongoose');

// App dependencies
var config = require('./app/config');
var api = require('./app/api');

// Connect to DB
//console.log('[DB] url:' + config.db.url);
//mongoose.connect(config.db.url, {server: {socketOptions: {keepAlive: 1}}});
//mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

// App config
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);

// Set options & middleware
app.disable('x-powered-by');
app.use(compression());
app.use(express.static(path.join(__dirname, config.web.static_dir)));

// Logger
app.get('*', function (req, res, next) {
    console.log('[%s]: %s', req.method, req.url);
    next();
});


// REST API
// Test: curl -is http://localhost:5000/api
//
app.get('/api/user', api.user);


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
