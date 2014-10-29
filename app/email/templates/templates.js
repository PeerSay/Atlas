/*global __dirname:true*/
var path = require('path');
var swig = require('swig');

function getTemplate (name) {
    return swig.compileFile(path.join(__dirname, name, 'body.html'));
}

module.exports = {
    'account-activation': {
        subj: '[ACTION REQUIRED] Complete Your PeerSay Account Registration',
        tpl: getTemplate('account-activation')
    },
    'welcome': {
        subj: 'Welcome to PeerSay!',
        tpl: getTemplate('welcome')
    },
    'restore-pwd': {
        subj: '[ACTION REQUIRED] Restore Your PeerSay Password',
        tpl: getTemplate('restore-pwd')
    }
};