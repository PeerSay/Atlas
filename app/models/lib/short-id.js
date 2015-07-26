var ShortId = require('mongoose-shortid-nodeps');

/**
 * From: https://github.com/coreh/uid2
 * 62 characters in the ascii range that can be used in URLs without special encoding.
 */
var UIDCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

var psShortId = {
    type: ShortId,
    len: 8,
    alphabet: UIDCHARS,
    retries: 10
};

module.exports = {
    psShortId: psShortId
};