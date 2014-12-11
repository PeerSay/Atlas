var util = require('util');

var errors = {
    badRequest: {
        status: 400,
        msg: 'Bad request: %s'
    },
    notAuthorized: {
        status: 401,
        msg: 'Not authorized'
    },
    notFound: {
        status: 404,
        msg: 'Not found: %s'
    },
    notAcceptable: {
        status: 406,
        msg: 'Not acceptable: %s'
    },
    notValid: {
        status: 409,
        msg: 'Not valid: %s'
    }
};

var responses = {};
Object.keys(errors).forEach(function (key) {
    responses[key] = function (res, msg) {
        var err = errors[key];
        return res
            .status(err.status)
            .send({error: util.format(err.msg, msg)});
    };
});


module.exports = responses;
