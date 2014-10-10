var crypto = require('crypto');

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

module.exports = {
    hasher: hasher
};