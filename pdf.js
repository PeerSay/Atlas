var path = require('path');
var express = require('express');
var phantom = require('./app/pdf/phantom-pdf');

var app = express();
var http = require('http').Server(app);
var nextFile = nextFileFn();

// Routs
var static_dir = path.join(__dirname, '.', 'static');
app.use(express.static(static_dir));
app.get('/api/pdf', respondPDF);


function respondPDF(req, res, next) {
    var url = "http://localhost:5005/pdf-demo.html";

    phantom.renderPDF(url, nextFile())
        .then(function (file) {
            res.json({result: file});
        })
        .catch(function (reason) {
            res.json({error: reason.toString()});
        });
}

function nextFileFn() {
    var i = 0;
    return function () {
        return './file' + (i++) + '.pdf';
    }
}

// Run
var port = 5005;
http.listen(port, function () {
    console.log('[Web] Listening on %s...', port);
});