var crypto = require('crypto');

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

// Credit: http://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
// @unused
function isValidDate(d) {
    if (Object.prototype.toString.call(d) !== "[object Date]")
        return false;
    return !isNaN(d.getTime());
}


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
    isValidDate: isValidDate,
    isEmptyObj: isEmptyObj,
    baseURL: baseURL
};