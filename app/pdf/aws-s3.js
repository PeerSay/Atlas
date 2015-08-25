var Q = require('q');
var fs = require('fs');
var AWS = require('aws-sdk');
var format = require('util').format;

// Configure
var config = require('../../app/config');
var AWS_ACCESS_KEY = config.s3.aws_access_key;
var AWS_SECRET_KEY = config.s3.aws_secret_key;
var S3_BUCKET = config.s3.bucket_name;
var enabled = config.s3.enable;

AWS.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});

console.log(' [S3] enabled: %s', enabled && S3_BUCKET);


function skip(op) {
    return function () {
        return Q.fcall(function () {
            console.log('[S3] SKIPPED %s - disabled by config', op);
            return format("%s disabled by config", op);
        });
    }
}

function createBucket(bucketName) {
    var deferred = Q.defer();
    var bucketParams = {
        Bucket: bucketName,
        ACL: 'public-read' // readable by all!
    };
    var s3bucket = new AWS.S3({params: bucketParams});

    s3bucket.createBucket(function (err) {
        if (err) {
            deferred.reject(new Error('createBucket failed: ', err.toString()));

        } else {
            deferred.resolve(bucketName);
        }
    });

    return deferred.promise;
}

// upload
//

//@formatter:off
/* fileSpecs = {
   name: '',
   path: '',
   contentType: ''
 }
*/
//@formatter:on
function uploadOne(file, bucketName) {
    var deferred = Q.defer();
    var body = fs.createReadStream(file.path);
    var uploadParams = {
        Bucket: bucketName,
        Key: file.name,
        Body: body,
        ContentType: file.contentType,
        ContentDisposition: 'inline', // force open in browser rather than download
        ACL: 'public-read' // readable by all!
    };
    var s3 = new AWS.S3();

    console.log("[S3] Uploading[%s] to[%s]", file.name, bucketName);

    s3.upload(uploadParams)
        .on('httpUploadProgress', function (evt) {
            console.log('[S3] Uploading[%s] progress: %s', file.name, JSON.stringify(evt));
        })
        .send(function (err, data) {
            if (err) {
                deferred.reject(new Error('upload failed: ', err.toString()));
            } else {
                deferred.resolve(data.Location);
            }
        });

    return deferred.promise;
}

function upload(fileSpecs, to) {
    var bucketName = S3_BUCKET + '/' + to.subDir;

    return createBucket(bucketName)
        .then(function () {
            var fileQs = fileSpecs.map(function (file) {
                return uploadOne(file, bucketName);
            });

            return Q.all(fileQs);
        })
        .catch(function (reason) {
            console.log('[S3] Error: ', reason);
            return Q.reject(reason);
        });
}

// remove
//

//@formatter:off
/* from = {
   name: '',
   subDir: ''
 }
*/
//@formatter:on
function removeOne(from) {
    var deferred = Q.defer();
    var bucketName = S3_BUCKET + '/' + from.subDir;
    var deleteParams = {
        Bucket: bucketName,
        Key: from.name
    };
    var s3 = new AWS.S3();

    console.log("[S3] Removing[%s] from[%s]", from.name, bucketName);

    s3.deleteObject(deleteParams, function (err, data) {
        if (err) {
            deferred.reject(new Error('deleteObject failed: ', err.toString()));
        } else {
            deferred.resolve('ok');
        }
    });

    return deferred.promise;
}


function remove(fromSpecs) {
    var fileQs = fromSpecs.map(function (from) {
        return removeOne(from);
    });

    return Q.all(fileQs).catch(function (reason) {
        console.log('[S3] Error: ', reason);
        return Q.reject(reason);
    });
}

// removeBucket
//
function _removeBucket(subDir) {
    var deferred = Q.defer();
    var bucketName = S3_BUCKET + '/' + subDir;
    var params = {
        Bucket: bucketName
    };
    var s3 = new AWS.S3();

    console.log("[S3] Removing bucket[%s]", bucketName);

    s3.deleteBucket(params, function (err, data) {
        if (err) {
            deferred.reject(new Error('deleteBucket failed: ', err.toString()));
        }
        else {
            deferred.resolve('ok');
        }
    });

    return deferred.promise;
}

function removeBucket(subDir) {
    return _removeBucket(subDir).catch(function (reason) {
        console.log('[S3] Error: ', reason);
        return Q.reject(reason);
    });
}

// getObject
//
//@formatter:off
/* from = {
   subDir: '',
   fileName: ''
 }
*/
//@formatter:on
function getObject(from, toFilePath) {
    var deferred = Q.defer();
    var s3 = new AWS.S3();
    var bucketName = S3_BUCKET + '/' + from.subDir;
    var params = {Bucket: bucketName, Key: from.fileName};
    var file = fs.createWriteStream(toFilePath)
        .on('finish', function () {
            deferred.resolve('ok');
        })
        .on('error', function (err) {
            deferred.reject(new Error('getObject failed: ', err));
        });

    console.log("[S3] Get-object %s to[%s]", JSON.stringify(from), toFilePath);

    s3.getObject(params).createReadStream().pipe(file);

    return deferred.promise;
}

module.exports = {
    upload: enabled ? upload : skip('upload'),
    remove: enabled ? remove : skip('remove'),
    removeBucket: enabled ? removeBucket : skip('removeBucket'),
    getObject: enabled ? getObject: skip('getObject')
};
