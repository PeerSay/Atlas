// app.js
var express = require("express");
var path = require('path');
var app = express();
var http = require('http').Server(app);
var sio = require('socket.io')(http);


// Middleware

// Static
var static_path = path.join(__dirname, 'static');
app.use(express.static(static_path));

// Logger
app.get('*', function (req, res, next) {
    console.log('[%s]: %s', req.method, req.url);
    next();
});

// Routes
app.get('/', function (req, res) {
    res.sendFile('index.html');
});

// Test: curl -is http://localhost:5000/api
app.get('/api', function (req, res) {
    res.send({ok: 'Hello World!'});
});


// Run

var port = Number(process.env.PORT || 5000);
http.listen(port, function () {
    console.log("Listening on " + port);
});


// Socket

sio.on('connection', function (socket) {
    console.log('New socket: client.id=[%s]', socket.client.id);

    socket.emit('msg', 'hello');
    socket.join('room');

    socket.on('disconnect', function () {
        console.log('disconnect');
    });
});

var counter = 0;
setInterval(function () {
    sio.to('room').emit('msg', {cnt: counter++});
}, 2000);
