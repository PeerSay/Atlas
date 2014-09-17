// app.js
var express = require("express");
var path = require('path');
var app = express();
var static_path = path.join(__dirname, 'static');


// Middleware

// Static
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
app.listen(port, function () {
    console.log("Listening on " + port);
});