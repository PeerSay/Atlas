var Q = require('q');
var path = require('path');
var phantom = require('phantom');

Q.longStackSupport = true;

var phantomBinary = phantomJSExePath(require('phantomjs').path);
var procPromise = startProcess();


process.on('exit', function (code, signal) {
    procPromise.then(function (ph) {
        console.log('[PH] exiting on signal...');
        ph.exit();
    });
});

function startProcess() {
    var deferred = Q.defer();
    var options = {
        binary: phantomBinary,
        onExit: exitCallback
    };

    console.log(' [PH] new process...');

    phantom.create(function (ph) {
        console.log(' [PH] process started');
        deferred.resolve(ph);
    }, options);

    return deferred.promise;
}

function phantomJSExePath(phantomSource) {
    // Courtesy by karma-phantomjs-launcher:
    // If the path we're given by phantomjs is to a .cmd, it is pointing to a global copy.
    // Using the cmd as the process to execute causes problems cleaning up the processes
    // so we walk from the cmd to the phantomjs.exe and use that instead.

    if (path.extname(phantomSource).toLowerCase() === '.cmd') {
        return path.join(path.dirname( phantomSource ), '//node_modules//phantomjs//lib//phantom//phantomjs.exe');
    }

    return phantomSource;
}

function exitCallback() {
    console.log('[PH] process exit cb=', arguments);
}


function createPage(ph) {
    var deferred = Q.defer();

    try {
        ph.createPage(function (page) {
            console.log('[PH] page created');
            deferred.resolve(page);
        });
    } catch (e) {
        deferred.reject(new Error('failed to create page: ', e.toString()));
    }

    return deferred.promise;
}

function render(page, url, outPath) {
    var deferred = Q.defer();
    var timeout = 2000;
    var done = false;
    var pageSizeOptions = {
        format: 'A4',
        orientation: 'landscape'
    };

    setTimeout(function () {
        if (!done) {
            deferred.reject(new Error('timeout reached'));
        }
    }, timeout);

    try {
        page.open(url, function (status) {
            console.log("[PH] page opened [%s] status: ", url, status);

            // Wait till page signals that it is OK to render
            page.set('onCallback', function(result) {
                console.log("[PH] callback received: %s", JSON.stringify(result));

                done = true;

                if (!result.done) {
                    return deferred.reject(new Error('bad callback: ' + JSON.stringify(result)));
                }

                page.set('paperSize', pageSizeOptions, function () {
                    page.render(outPath, function () {
                        console.log("[PH] file rendered to [%s]", outPath);

                        page.close();
                        console.log("[PH] page closed - done");

                        deferred.resolve(outPath);
                    });
                });
            });
        });
    } catch(e) {
        deferred.reject(new Error('failed to render: ' + e.toString()));
    }

    return deferred.promise;
}

function renderPDF(pageUrl, outPath) {
    return procPromise
        .then(function (ph) {
            console.log('[PH] new page...');
            return createPage(ph);
        })
        .then(function (page) {
            console.log('[PH] rendering...');
            return render(page, pageUrl, outPath);
        })
        .catch(function (reason) {
            console.log('[PH] Error: ', reason);
            return Q.reject(reason);
        });
}

module.exports = {
    renderPDF: renderPDF
};