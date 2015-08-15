var Q = require('Q');
var fs = require('fs');
var AWS = require('aws-sdk');

// Configure
var config = require('../../app/config');
var AWS_ACCESS_KEY = config.s3.aws_access_key;
var AWS_SECRET_KEY = config.s3.aws_secret_key;
var S3_BUCKET = config.s3.bucket_name;
var enabled = config.s3.enable;

AWS.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});

console.log(' [S3] enabled: %s', enabled && S3_BUCKET);


function skip() {
    return Q.fcall(function () {
        console.log('[S3] SKIPPED - disabled by config');
        return "disabled by config";
    });
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

//@formatter:off
/*
 fileSpecs is: {
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

    console.log("[S3] Uploading[%s] to: %s", file.name, bucketName);

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

    if (!enabled) { return skip(); }

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
        })
}

function remove(from, cb) {
    var s3 = new AWS.S3();
    var bucket = S3_BUCKET + '/' + from.subDir;
    var params = {
        Bucket: bucket,
        Key: from.fileName
    };

    s3.deleteObject(params, function (err, data) {
        if (err) {
            console.log('[S3] Delete error: ', err);
            return cb(err);
        }

        console.log('[S3] Delete success');
        cb(null, data);
    });
}


module.exports = {
    upload: upload,
    remove: remove
};
