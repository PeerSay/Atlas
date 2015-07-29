var fs = require('fs');
var AWS = require('aws-sdk');

// Configure
var config = require('../../app/config');
var AWS_ACCESS_KEY = config.s3.aws_access_key;
var AWS_SECRET_KEY = config.s3.aws_secret_key;
var S3_BUCKET = config.s3.bucket_name;

AWS.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});


function upload(fileOnDisk, to, cb) {
    var bucket = S3_BUCKET + '/' + to.subDir;
    var body = fs.createReadStream(fileOnDisk);
    var params = {
        Bucket: bucket,
        Key: to.fileName,
        ACL: 'public-read', // readable by all
        ContentDisposition: 'inline', // force open in browser rather than download
        ContentType: 'application/pdf' // need for open too, TODO: other types
    };
    var s3 = new AWS.S3({params: params});

    console.log("[S3] Creating bucket[%s]...", bucket);

    s3.createBucket(function (err) {
        if (err) {
            console.log("[S3] Error createBucket:", err);
        }
        else {
            console.log("[S3] Uploading[%s] to: ", fileOnDisk, JSON.stringify(to));

            s3.upload({Body: body})
                .on('httpUploadProgress', function (evt) {
                    console.log('[S3] Uploading progress: ', JSON.stringify(evt));
                })
                .send(function (err, data) {
                    if (err) {
                        console.log('[S3] Upload error: ', err);
                        return cb(err);
                    }

                    console.log('[S3] Upload success to[%s]: ', data.Location);
                    cb(null, data);
                });
        }
    });
}

function remove(from, cb) {
    var s3 = new AWS.S3();
    var bucket = S3_BUCKET + '/' + from.subDir;
    var params = {
        Bucket: bucket,
        Key: from.fileName
    };

    s3.deleteObject(params, function(err, data) {
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
