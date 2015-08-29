var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');

var config = require(appRoot + '/app/config');
var templates = require(__dirname + '/templates/templates.js');

var client = nodemailer.createTransport(sgTransport(config.email), {debug: true});
var enabled = config.email.enable;

console.log(' [Email] enabled: %s', enabled && 'SendGrid');


// Usage: mailer.send('welcome', locals, cb)
//  {locals} must contain at least to & from fields.
//
function send(tpl_name, locals, cb) {
    var config = templates[tpl_name];
    var to = locals.to;
    var from = locals.from;
    var subj = config.subj;
    if (typeof subj === 'function') {
        subj = subj(locals);
    }

    var email = {
        from: from, // Displayed in email by SendGrid
        to: to,
        subject: subj,
        html: config.tpl(locals),
        generateTextFromHTML: true,
        "x-smtpapi": { "category": tpl_name } // TODO: fix
    };
    cb = cb || function () {}; // optional

    console.log('[EMAIL] Sending [%s]: [%s] -> [%s]', tpl_name, from, to);

    client.sendMail(email, function (err, info) {
        if (err) {
            console.log('[EMAIL] Error sending [%s]: [%s] -> [%s]: ', tpl_name, from, to, err);
            return cb(err);
        }

        console.log('[EMAIL] Message [%s] sent: [%s] -> [%s], response: [%s]', tpl_name, from, to, info.response);
        cb(null, info.response);
    });
}

function dummySend(tpl_name, locals) {
    console.log('[EMAIL] SKIPPED sending [%s]: [%s] -> [%s]: disabled by config', tpl_name, locals.from, locals.to);
}

module.exports = {
    send: enabled ? send : dummySend
};
