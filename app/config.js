/*global __dirname:true*/

var path = require('path');

// Passed by Heroku
var ENV_PORT = Number(process.env.PORT);
var ENV_SERVER_URL = process.env.SERVER_URL;
var ENV_DB_URL = process.env.MONGOHQ_URL;
var ENV_LINKEDIN_API_KEY = process.env.LINKEDIN_API_KEY;
var ENV_LINKEDIN_SECRET_KEY = process.env.LINKEDIN_SECRET_KEY;
var ENV_SENDGRID_API_USER = process.env.SENDGRID_API_USER;
var ENV_SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
var ENV_S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
var ENV_AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
var ENV_AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;

// For local deploy override:
//  create non-committed file in root named config.{deploy}.js
//  run server as:          node server.js {deploy}
//  or by npm shortcut:     npm run {deploy}
//
function readConfig(name) {
    var configPath = ('../config.' + name).trim();
    var local;
    try {
        local = require(configPath);
    }
    catch (e) {
        throw "Cannot read config: " + configPath;
    }
    return local;
}


// Called in different deploys with 'param' equal:
//  prod: undefined (means read default config)
//  dev/stage: 'name' (means read config from corresponding name file)
//  test: {...} (means use config obj passed by test)
//
function getConfig(param) {
    var deploy, local;
    var empty = {web: {}, db: {}, auth: {linkedin: {}}, email: {enable: true, auth: {}}, s3: {enable: true}};

    if (!param) {
        deploy = 'prod';
        local = empty;
    }
    else if (typeof param === 'string') {
        deploy = param;
        local = readConfig(deploy);
    }
    else {
        deploy = 'test';
        local = param;
    }

    var config = {
        deploy: deploy,
        web: {
            port: local.web.port || ENV_PORT,
            server_url: local.web.server_url || ENV_SERVER_URL,
            static_dir: local.web.static_dir || path.join(__dirname, '..', 'dist')
        },
        db: {
            url: local.db.url || ENV_DB_URL,
            hash_iters: local.db.hash_iters || 100000
        },
        auth: {
            linkedin: {
                api_key: local.auth.linkedin.api_key || ENV_LINKEDIN_API_KEY,
                secret_key: local.auth.linkedin.secret_key || ENV_LINKEDIN_SECRET_KEY
            }
        },
        email: {
            enable: local.email.enable,
            auth: {
                api_user: local.email.auth.api_user || ENV_SENDGRID_API_USER,
                api_key: local.email.auth.api_key || ENV_SENDGRID_API_KEY
            }
        },
        s3: {
            enable: local.s3.enable,
            bucket_name: local.s3.bucket_name || ENV_S3_BUCKET_NAME,
            aws_access_key: local.s3.aws_access_key || ENV_AWS_ACCESS_KEY,
            aws_secret_key: local.s3.aws_secret_key || ENV_AWS_SECRET_KEY
        }
    };

    // Prevent common abuse case
    if (!config.web.port && deploy !== 'test') {
        throw "Not Production env!\n use 'npm run stage|dev'"
    }

    console.log('[APP] Deploy: %s', deploy);

    return config;
}

// Param passed by caller via global
//
module.exports = getConfig(process.deploy);
