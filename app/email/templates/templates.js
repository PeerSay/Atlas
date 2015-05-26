/*global __dirname:true*/
var path = require('path');
var swig = require('swig');

function getTemplateFile(subdir) {
    return swig.compileFile(path.join(__dirname, subdir, 'body.html'));
}

function getTemplateStr(str) {
    return swig.compile(str, {autoescape: false});
}


module.exports = {
    'account-activation': {
        subj: '[ACTION REQUIRED] Complete Your PeerSay Account Registration',
        tpl: getTemplateFile('account-activation')
    },
    'welcome': {
        subj: 'Welcome to PeerSay!',
        tpl: getTemplateFile('welcome')
    },
    'restore-pwd': {
        subj: '[ACTION REQUIRED] Restore Your PeerSay Password',
        tpl: getTemplateFile('restore-pwd')
    },
    'say-hello': {
        subj: getTemplateStr('[Landing Page] Hello from {{ from }}'),
        tpl: getTemplateFile('say-hello')
    },
    'waiting-user': {
        subj: 'A user is waiting!',
        tpl: getTemplateFile('waiting-user')
    }
};
