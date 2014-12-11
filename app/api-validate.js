var jsonParser = require('body-parser').json();
var util = require('../app/util');
var errRes = require('../app/api-errors');


function ApiValidate(app) {
    var V = {};

    function setupRoutes() {
        app.use('/api/*', validateAccept);
        app.post('/api/*', jsonParser, validateBody);
        app.put('/api/*', jsonParser, validateBody);

        return V;
    }

    function validateAccept(req, res, next) {
        res.format({
            json: function () {
                // if no Accept, json is considered
                res.type('json');
                next();
            },
            'default': function () {
                errRes.notAcceptable(res, req.headers.accept);
            }
        });
    }

    function validateBody(reg, res, next) {
        if (util.isEmptyObj(reg.body)) {
            errRes.badRequest(res, 'not JSON');
        }
        next();
    }

    V.setupRoutes = setupRoutes;
    return V;
}


module.exports = ApiValidate;
