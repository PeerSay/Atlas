/*global __dirname:true*/

var path = require('path');

// Passed by Heroku
var ENV_PORT = Number(process.env.PORT);
var ENV_DB_URL = process.env.MONGOHQ_URL;


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
    var empty = {web: {}, db: {}};

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
            static_dir: local.web.static_dir || path.join(__dirname, '..', 'dist')
        },
        db: {
            url: local.db.url || ENV_DB_URL,
            hash_iters: local.db.hash_iters || 100000
        },
        auth: {
            linkedin: {
                api_key: '77st41xz0halpu',
                secret_key: 'nVcfUeYOJSx8vEaP'
            }
        },
        email: {
            enable: (local.email || {enable: true}).enable,
            auth: {
                api_user: 'peersaymailer',
                api_key: 'Peersay1'
            }
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
