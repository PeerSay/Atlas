var crypto = require('crypto');
var fs = require('fs');

// Authentication
//
function randomBase64(bytes_num, cb) {
    return crypto.randomBytes(bytes_num, function (err, buf) {
        if (err) cb(err);
        cb(null, buf.toString('base64'));
    });
}

function hasher(opts, cb) {
    // Credit: http://www.boronine.com/2012/08/30/Strong-Password-Hashing-with-Node-Standard-Library/

    // Generate a random 8-character base64 password if none provided
    if (!opts.plaintext) {
        return crypto.randomBytes(8, function (err, buf) {
            if (err) cb(err);
            opts.plaintext = buf.toString('base64');
            hasher(opts, cb);
        });
    }
    // Generate random 512-bit salt if no salt provided
    if (!opts.salt) {
        return crypto.randomBytes(64, function (err, buf) {
            if (err) cb(err);
            opts.salt = buf;
            hasher(opts, cb);
        });
    }

    opts.hash = 'sha1';
    opts.iterations = opts.iterations || 10000;
    crypto.pbkdf2(opts.plaintext, opts.salt, opts.iterations, 64, function (err, key) {
        if (err) cb(err);
        opts.key = new Buffer(key);
        cb(null, opts);
    });
}

function genRestorePwdKey() {
    return Math.random().toString(36).substring(9);
}

// FS
//

function isFileExistsSync(filePath) {
    var stat;
    try {
        stat = fs.lstatSync(filePath);
        if (stat.isFile()) {
            return true;
        }
    } catch(e) {}

    return false;
}

function fileSizeSync(filePath) {
    var stat;
    try {
        stat = fs.statSync(filePath);
    } catch(e) {
        return 0;
    }
    return stat.size;
}

// Misc
//

function isEmptyObj(obj) {
    return !Object.keys(obj).length;
}

function baseURL(req) {
    // See: http://stackoverflow.com/questions/10183291/how-to-get-the-full-url-in-express-js
    // and: https://tools.ietf.org/html/rfc7230#section-5.4
    return req.protocol + '://' + req.get('host');
}

module.exports = {
    hasher: hasher,
    randomBase64: randomBase64,
    genRestorePwdKey: genRestorePwdKey,

    isFileExistsSync: isFileExistsSync,
    fileSizeSync: fileSizeSync,

    isEmptyObj: isEmptyObj,
    baseURL: baseURL
};
