/*global __dirname:true*/

var path = require('path');

// Local deploy overrides:
//  create non-committed files in root named config.{deploy}.js
//  run server as set _DEPLOY={deploy} && node server.js
//  or by npm shortcut: npm run {deploy}
//
var ENV_DEPLOY = process.env._DEPLOY;
var local_config = ('../config.' + ENV_DEPLOY).trim();
var empty = {web: {}, db: {}};
var local;
try {
    local = require(local_config);
}
catch(e) {
    local = empty;
}

// Passed by Heroku
var ENV_PORT = Number(process.env.PORT);
var ENV_DB_URL = process.env.MONGOHQ_URL;

var port = local.web.port || ENV_PORT;
if (!port) {
    throw "Not Production env!\n use 'npm run stage|dev'"
}
console.log('[APP] Deploy: %s', ENV_DEPLOY || 'prod');

// Default config is Prod!
module.exports = {
    web: {
        port: port,
        base_url:  local.web.base_url || 'http://peersay.herokuapp.com',
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
