var nodemailer = require('nodemailer');
var config = require('../../app/config');
var templates = require('../../app/email/templates/templates.js');

var sgTransport = require('nodemailer-sendgrid-transport');
var client = nodemailer.createTransport(sgTransport(config.email));
var enabled = config.email.enable;

console.log(' [Email] enabled: %s', enabled && 'SendGrid');


// Usage: mailer.send(to, 'welcome', locals, cb)
//
function send(to, tpl_name, locals, cb) {
    var tpl = templates[tpl_name];
    var email = {
        from: 'PeerSay Team <team@peersay.com>', // Displayed in email by SendGrid
        to: to,
        subject: tpl.subj,
        html: tpl.tpl(locals),
        generateTextFromHTML: true,
        "x-smtpapi": { "category": tpl_name } // TODO: fix
    };
    cb = cb || function () {
    }; // optional

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
    send: enabled ? send : function () {}
};