/*global __dirname:true*/
var path = require('path');
var swig = require('swig');

function getTemplate (name) {
    return swig.compileFile(path.join(__dirname, name, 'body.html'));
}

module.exports = {
    'welcome': {
        subj: 'Welcome to Peersay!',
        tpl: getTemplate('welcome')
    },
    'account-activation': {
        subj: '[ACTION REQUIRED] Complete Your Peersay Account Registration',
        tpl: getTemplate('account-activation')
    }
};