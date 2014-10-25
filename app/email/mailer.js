var nodemailer = require('nodemailer');
var config = require('../../app/config');
var templates = require('../../app/email/templates/templates.js');

// TODO:
//var sgTransport = require('nodemailer-sendgrid-transport');
//var client = nodemailer.createTransport(sgTransport(config.email));

var gmailTransport = {
    service: 'Gmail',
    auth: config.email.auth
};
var client = nodemailer.createTransport(gmailTransport);


// Usage: mailer.send(to, 'welcome', locals, cb)
//
function send(to, tpl_name, locals, cb) {
    var tpl = templates[tpl_name];
    var email = {
        from: 'team@peersay.com', // has no effect for gmail
        to: to,
        subject: tpl.subj,
        html: tpl.tpl(locals)
    };
    cb = cb || function () {}; // optional

    console.log('[EMAIL] Sending [%s] to [%s]', tpl_name, to);

    client.sendMail(email, function (err, info) {
        if (err) {
            console.log('[EMAIL] Error sending [%s] to [%s]: ', tpl_name, to, err);
            return cb(err);
        }

        console.log('[EMAIL] Message [%s] sent to [%s], response: %s', tpl_name, to, info.response);
        cb(null, info.response);
    });
}


module.exports = {
    send: send
};