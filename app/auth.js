//var _ = require('lodash');
//var jsonParser = require('body-parser').json();


function Auth(app) {
    var U = {};

    function setupRoutes() {
        app.get('/login', appEntry);
        app.get('/signup', appEntry);
        app.get('/dashboard', appEntry);
        return U;
    }

    function appEntry (req, res) {
        var options = {
            root: app.config.web.static_dir
        };
        res.sendFile('app.html', options);
    }


    U.setupRoutes = setupRoutes;
    return U;
}


module.exports = Auth;
