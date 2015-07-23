var path = require('path');
var express = require('express');
var phantom = require('phantom');

var app = express();
var http = require('http').Server(app);

// Routs
var static_dir = path.join(__dirname, '.', 'static');
app.use(express.static(static_dir));
app.get('/api/pdf', generatePDF);


function generatePDF(res, req, next) {
    var url = '';

    phantom.create(function (ph) {
        ph.createPage(function (page) {

            page.open("http://www.google.com", function (status) {
                console.log("opened google? ", status);


                page.evaluate(function () { return document.title; }, function (result) {
                    console.log('Page title is ' + result);
                    ph.exit();
                });
            });
        });
    });

}

// Run
var port = 5005;
http.listen(port, function () {
    console.log('[Web] Listening on %s...', port);
});